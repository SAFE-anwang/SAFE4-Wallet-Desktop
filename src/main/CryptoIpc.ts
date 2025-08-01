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

export async function scryptDecryptWalletKys(Base58Encode: string, password: string): Promise<{
  walletKeystores: WalletKeystore[],
  aes: any,
  salt: string
}> {

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
    walletKeystores,
    aes,
    salt
  }
}

export async function scryptEncryWalletKeystores(
  walletKeystores: WalletKeystore[],
  { aes, salt }: {
    aes: any | undefined,
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

  // Always new IV by secret with random-iv(32 byte length);
  const iv = CryptoJS.lib.WordArray.random(32);
  if (password) {
    salt = crypto.randomBytes(32).toString("hex");
    if (!salt) return;
    aes = await scryptDrive(password, salt);
    console.log("Use [New_Password] To Drived A New Aes-Key For AES-Encrypt.");
  } else {
    console.log("Use Cached [..Aes-Key..]:[{}] For AES-Encrypt", CryptoJS.enc.Hex.stringify(aes));
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
    aes,
    salt
  }
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
  return uint8ArrayToWordArray(derivedKey);
}


export function uint8ArrayToWordArray(buffer: Buffer) {
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

export function wordArrayToUint8Array(wordArray: any): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    const word = words[i >>> 2];  // 等价于 Math.floor(i / 4)
    u8[i] = (word >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

