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


  constructor(ipcMain: any) {

  }

}

export async function scryptDecryptWalletKys(Base58Encode: string , password : string) {

  const encrypt = JSON.parse(
    ethers.utils.toUtf8String(
      ethers.utils.base58.decode(Base58Encode)
    )
  );
  const salt = encrypt.salt;
  const ciphertext = CryptoJS.enc.Hex.parse(encrypt.ciphertext);
  const iv = CryptoJS.enc.Hex.parse(encrypt.iv);

  const aes = await scryptDrive(password, salt);
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    aes,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  let text = decrypted.toString(CryptoJS.enc.Utf8);
  let walletKeystores = JSON.parse(text);
  return {
    walletKeystores ,
    _aes : CryptoJS.enc.Hex.stringify(aes),
    salt
  }
}

export async function scryptEncryWalletKeystores(
  walletKeystores: WalletKeystore[],
  { _aes, salt }: {
    _aes: string | undefined,
    salt: string | undefined
  },
  password?: string
) {
  const crypto = require('crypto');

  let _walletKeystores = walletKeystores.map(walletKeystore => {
    const { mnemonic, password, path, privateKey, publicKey, address } = walletKeystore;
    return {
      mnemonic, password, path, privateKey, publicKey, address
    }
  });
  let text = JSON.stringify(_walletKeystores);
  _walletKeystores = [];

  let aes = undefined;
  // Always new IV by secret with random-iv(32 byte length);
  const iv = CryptoJS.lib.WordArray.random(32);
  if (password) {
    salt = crypto.randomBytes(32).toString("hex");
    if (!salt) return;
    aes = await scryptDrive(password, salt);
    console.log("Use New Password To Drived A New Aes-Key For AES-Encrypt");
  } else {
    aes = CryptoJS.enc.Hex.parse(_aes);
    console.log("Use Cached Aes-Key For AES-Encrypt");
  }

  // AES-Encrypt & Saved as JSON Constructure In BASE58
  const encrypt = CryptoJS.AES.encrypt(
    text, aes,
    { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );
  text = '';
  const json = JSON.stringify({
    salt: salt,
    iv: CryptoJS.enc.Hex.stringify(iv),
    ciphertext: encrypt.ciphertext.toString(CryptoJS.enc.Hex)
  });
  const Base58Encode = base58.encode(ethers.utils.toUtf8Bytes(json));
  return {
    Base58Encode,
    _aes: CryptoJS.enc.Hex.stringify(aes),
    salt
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


export async function scryptDrive(password: string, salt: string): Promise<any> {
  const crypto = require('crypto');
  let derivedKey = Buffer.from(password);
  for (let i = 0; i < iterations; i++) {
    derivedKey = await new Promise((resolve, reject) => {
      /** No Salt Buffer */
      crypto.scrypt(derivedKey, salt, dkLen, { N, r, p }, (err: any, _derivedKey: any) => {
        if (err) reject(err);
        else resolve(_derivedKey);
      });
    });
  }
  return bufferToWordArray(derivedKey);
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

