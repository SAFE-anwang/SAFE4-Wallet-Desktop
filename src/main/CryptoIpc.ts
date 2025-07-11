import { Context } from './handlers/Context';
const CryptoJS = require('crypto-js');
import { ethers } from "ethers";
import { base58 } from "ethers/lib/utils";
import { WalletIpc } from './WalletIpc';

// 设置 scrypt 参数
// [ 1024 , 2048 , 4096 , 8192 , 16384 , 32768 , 65536 , 131072 , 262144 ]
const N = 16384;                  // 每次迭代次数（必须为2的幂）
const r = 8;                      // 块大小因子
const p = 1;                      // 并行化因子
const dkLen = 32;                 // 生成32字节（256位）的密钥
const TargetN = 262144;           // 迭代目标次数
const iterations = TargetN / N;   // 计算循环迭代的次数

export class CryptoIpc {

  walletIpc: WalletIpc;

  constructor(ipcMain: any, walletIpc: WalletIpc) {
    ipcMain.handle("crypto-scrypt-decrypt", async (event: any, params: any) => {
      const { encrypt, password } = params;
      const result = await this.scryptDecryptWallets(encrypt, password);
      return result;
    })
    this.walletIpc = walletIpc;
  }

  private async scryptDecryptWallets(encrypt: any, password: string): Promise<any[]> {
    const crypto = require('crypto');
    const salt = encrypt.salt;
    const ciphertext = CryptoJS.enc.Hex.parse(encrypt.ciphertext);
    const iv = CryptoJS.enc.Hex.parse(encrypt.iv);
    let derivedKey = Buffer.from(password);

    const randomNumber = getRandomInt(0, iterations - 2);
    let memDrivedKey = undefined;

    for (let i = 0; i < iterations; i++) {
      derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(derivedKey, salt, dkLen, { N, r, p }, (err: any, _derivedKey: any) => {
          if (err) reject(err);
          else resolve(_derivedKey);
        });
      });
      if (i == randomNumber) {
        memDrivedKey = derivedKey;
      }
    }
    const aesKey = bufferToWordArray(derivedKey);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aesKey,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    const walletKeystores = JSON.parse(text);

    /** */
    if (memDrivedKey) {
      const memAesKey = bufferToWordArray(memDrivedKey);
      /////////
      const encryptWalletKeystores = Object.values(walletKeystores).map((walletKeystore: any) => {
        const _w = { ...walletKeystore } as {
          mnemonic?: string,
          path?: string,
          privateKey: string,
          address: string,
          publicKey: string
        };
        Object.keys(_w).forEach(prop => {
          switch (prop) {
            case 'mnemonic':
              const ciphertext_mnemonic = CryptoJS.AES.encrypt(
                _w.mnemonic, memAesKey,
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
              ).ciphertext.toString(CryptoJS.enc.Hex);
              _w.mnemonic = ciphertext_mnemonic;
              break;
            case 'privateKey':
              const ciphertext_privateKey = CryptoJS.AES.encrypt(
                _w.privateKey, memAesKey,
                { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
              ).ciphertext.toString(CryptoJS.enc.Hex);
              _w.privateKey = ciphertext_privateKey;
              break;
          }
        });
        return _w;
      });
      console.log("Encrypt Wallet Keystores[MEM]:", encryptWalletKeystores)
      /////////
      const encrypt = CryptoJS.AES.encrypt(
        text, memAesKey,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      const ciphertext = encrypt.ciphertext.toString(CryptoJS.enc.Hex);
      const memEncryptContent = JSON.stringify({
        salt: salt,
        iv: CryptoJS.enc.Hex.stringify(iv),
        ciphertext
      });

      // console.log("Mem Encrypt Content :", memEncryptContent);
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
        memAesKey,
        { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      );
      const memText = decrypted.toString(CryptoJS.enc.Utf8);
      const _iv = CryptoJS.enc.Hex.stringify(iv);
      const _aesKey = CryptoJS.enc.Hex.stringify(memAesKey);
      console.log({
        _iv, _aesKey
      });
      this.walletIpc.loadEncryptWalletKeystores(
        encryptWalletKeystores ,
        _iv,
        _aesKey
      )
      return [
        walletKeystores,
        encryptWalletKeystores,
        {
          _iv, _aesKey
        }
      ]
    }
    /** */
    return walletKeystores;
  }

}

export async function scryptEncryptWallets({ walletList, applicationPassword }: { walletList: any, applicationPassword: string }): Promise<string> {
  const crypto = require('crypto');
  const content = JSON.stringify(walletList);
  const salt = crypto.randomBytes(32).toString("hex");
  let derivedKey = Buffer.from(applicationPassword);
  for (let i = 0; i < iterations; i++) {
    derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(derivedKey, salt, dkLen, { N, r, p }, (err: any, _derivedKey: any) => {
        if (err) reject(err);
        else resolve(_derivedKey);
      });
    });
  }
  // aes by secret with random-iv(32 byte length)
  const iv = CryptoJS.lib.WordArray.random(32);
  const aesKey = bufferToWordArray(derivedKey);
  const encrypt = CryptoJS.AES.encrypt(
    content, aesKey,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  const json = JSON.stringify({
    salt: salt,
    iv: CryptoJS.enc.Hex.stringify(iv),
    ciphertext: encrypt.ciphertext.toString(CryptoJS.enc.Hex)
  });
  // base58
  const base58Encode = base58.encode(ethers.utils.toUtf8Bytes(json));
  return base58Encode;
}




function bufferToWordArray(buffer: Buffer) {
  const words = [];
  for (let i = 0; i < buffer.length; i += 4) {
    words.push(
      (buffer[i] << 24) |
      (buffer[i + 1] << 16) |
      (buffer[i + 2] << 8) |
      buffer[i + 3]
    );
  }
  return CryptoJS.lib.WordArray.create(words, buffer.length);
}

function getRandomInt(min: number, max: number): number {
  const _min = Math.ceil(min);
  const _max = Math.floor(max);
  return Math.floor(Math.random() * (_max - _min + 1)) + _min;
}
