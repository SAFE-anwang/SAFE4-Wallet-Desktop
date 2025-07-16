import { Context } from './handlers/Context';
const CryptoJS = require('crypto-js');
import { ethers } from "ethers";
import { base58 } from "ethers/lib/utils";
import { WalletIpc, WalletKeystore } from './WalletIpc';

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

    for (let i = 0; i < iterations; i++) {
      derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(derivedKey, salt, dkLen, { N, r, p }, (err: any, _derivedKey: any) => {
          if (err) reject(err);
          else resolve(_derivedKey);
        });
      });
    }

    const aesKey = bufferToWordArray(derivedKey);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aesKey,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    const walletKeystores = JSON.parse(text);

    /////////
    const encryptWalletKeystores = Object.values(walletKeystores).map((walletKeystore: any) => {

      const salt = crypto.randomBytes(32);
      const aes = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt.toString("hex")), {
        keySize: 256 / 32,
        iterations: 10000
      });
      const iv = CryptoJS.lib.WordArray.random(32);

      const _w = {
        ...walletKeystore,
        _salt: salt.toString("hex"),
        _aes: aes.toString(CryptoJS.enc.Hex),
        _iv: CryptoJS.enc.Hex.stringify(iv)
      } as WalletKeystore;

      Object.keys(_w).forEach(prop => {
        switch (prop) {
          case 'mnemonic':
            const ciphertext_mnemonic = CryptoJS.AES.encrypt(
              _w.mnemonic, aes,
              { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).ciphertext.toString(CryptoJS.enc.Hex);
            _w.mnemonic = ciphertext_mnemonic;
            break;
          case 'privateKey':
            const ciphertext_privateKey = CryptoJS.AES.encrypt(
              _w.privateKey, aes,
              { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).ciphertext.toString(CryptoJS.enc.Hex);
            _w.privateKey = ciphertext_privateKey;
            break;
          case 'password':
            const ciphertext_password = CryptoJS.AES.encrypt(
              _w.password, aes,
              { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).ciphertext.toString(CryptoJS.enc.Hex);
            _w.password = ciphertext_password;
            break;
        }
      });
      return _w;
    });

    const _iv = CryptoJS.enc.Hex.stringify(iv);
    const _aesKey = CryptoJS.enc.Hex.stringify(iv);

    this.walletIpc.loadEncryptWalletKeystores(
      encryptWalletKeystores,
    )
    return [
      walletKeystores,
      encryptWalletKeystores,
      {
        _iv, _aesKey
      }
    ]

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

