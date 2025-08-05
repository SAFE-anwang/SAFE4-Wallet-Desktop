import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import { ethers, TypedDataDomain } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { scryptDecryptWalletKys, scryptDrive, scryptEncryWalletKeystores, uint8ArrayToWordArray, wordArrayToUint8Array } from "./CryptoIpc";
import { generateNodeChildWallets } from "./WalletNodeGenerator";
import { SupportChildWalletType } from "../renderer/utils/GenerateChildWallet";

const CryptoJS = require('crypto-js');

export class WalletIpc {

  private safeStorage: Electron.SafeStorage | undefined;
  private kysDB: any;

  private salt: string | undefined;

  private maskInsertRule: MaskInsertRule | undefined;
  private byteOffsetRule: ByteOffsetRule | undefined;
  private obfuscationOdd: Buffer | undefined;
  private obfuscationEven: Buffer | undefined;
  private pwdKeyValidateHMAC: Buffer | undefined;

  encryptWalletKeystoreMap: {
    [address: string]: WalletKeystore
  } = {};

  constructor(ipcMain: any, kysDB: any, safeStorage: Electron.SafeStorage) {
    ipcMain.handle("wallet-signTransaction", async (event: any, _params: any) => {
      const [activeAccount, tx] = _params;
      return this.signTransaction(activeAccount, tx);
    })
    ipcMain.handle("wallet-viewMnemonic", async (event: any, _params: any) => {
      const [walletAddress, password] = _params;
      return this.viewMnemonic(walletAddress, password);
    })
    ipcMain.handle("wallet-viewPrivateKey", async (event: any, _params: any) => {
      const [walletAddress, password] = _params;
      return this.viewPrivateKey(walletAddress, password);
    })
    ipcMain.handle("wallet-viewKeystore", async (event: any, _params: any) => {
      const [walletAddress, password] = _params;
      return this.viewKeystore(walletAddress, password);
    })
    ipcMain.handle("wallet-updatePassword", async (event: any, _params: any) => {
      const [oldPassword, newPassword] = _params;
      return this.updatePassword(oldPassword, newPassword);
    })
    ipcMain.handle("wallet-decrypt", async (event: any, _params: any) => {
      const [password] = _params;
      return this.decryptKys(password);
    })
    ipcMain.handle("wallet-importWallet", async (event: any, _params: any) => {
      const [{
        mnemonic,
        password,
        path,
        privateKey
      }, initWalletPassword] = _params;
      return this.importWallet(mnemonic, password, path, privateKey, initWalletPassword);
    })

    ipcMain.handle("wallet-clean", async (event: any, _params: any) => {
      return this.clean();
    })

    ipcMain.handle("wallet-generate-nodechildwallets", async (event: any, _params: any) => {
      const [activeAccount, supportChildWalletType, _startAddressIndex, size] = _params;
      return this.generateNodeChildWallets(activeAccount, supportChildWalletType, _startAddressIndex, size);
    })

    ipcMain.handle("wallet-sign-typedData", async (event: any, _params: any) => {
      const [activeAccount, domain, types, message] = _params;
      return this.signTypedData(activeAccount, domain, types, message);
    })

    ipcMain.handle("wallet-drive-pkbypath", async (event: any, _params: any) => {
      const [activeAccount, path] = _params;
      return this.drivePrivateKeyByPath(activeAccount, path);
    })

    this.safeStorage = safeStorage;
    this.kysDB = kysDB;
  }

  private async decryptKys(password: string) {
    const Base58Encode = await this.loadKysFromDB();
    if (!Base58Encode) return;
    const {
      walletKeystores,
      aes,
      salt
    } = await scryptDecryptWalletKys(Base58Encode, password);
    const encryptWalletKeystores = await this.loadWalletKeystores(walletKeystores, { salt, aes });
    if (!encryptWalletKeystores) return;
    const wallets = encryptWalletKeystores.map(encryptWalletKeystore => {
      const { publicKey, address, path } = encryptWalletKeystore;
      return {
        publicKey, address, path
      }
    });
    return wallets;
  }

  private cachePwdKey(pwdKeyWordArray: any) {
    const pwdKeyUint8Array = wordArrayToUint8Array(pwdKeyWordArray);
    // 生成随机掩码插入规则,进行掩码混淆.
    const maskInsertRule = createMaskInsertRule(pwdKeyUint8Array.length, 20);
    const masked = maskUint8Array(pwdKeyUint8Array, maskInsertRule);
    // 生成随机字节偏移规则,进行偏移混淆.
    const byteOffsetRule = createOffsetRule(masked.length, masked.length / 2);
    const offseted = applyOffsets(masked, byteOffsetRule);
    // 奇偶分段
    const [odd, even] = splitByOddEven(offseted);

    this.obfuscationEven = even;
    this.obfuscationOdd = odd;
    this.maskInsertRule = maskInsertRule;
    this.byteOffsetRule = byteOffsetRule;
    // 使用 Electron.safestorage 进行奇段加密;
    if (this.safeStorage && this.safeStorage.isEncryptionAvailable()) {
      this.obfuscationOdd = this.safeStorage.encryptString(odd.toString("hex"));
    }
    this.pwdKeyValidateHMAC = CryptoJS.HmacSHA256(
      Buffer.concat([
        Buffer.from(masked),
        Buffer.from(offseted),
        Buffer.from(this.obfuscationOdd),
        Buffer.from(this.obfuscationEven)
      ]),
      pwdKeyWordArray
    );
  }

  private getPwdKey(): any {
    if (this.obfuscationEven && this.obfuscationOdd
      && this.maskInsertRule && this.byteOffsetRule
      && this.pwdKeyValidateHMAC) {

      let odd = this.obfuscationOdd;
      let even = this.obfuscationEven;
      if (this.safeStorage && this.safeStorage.isEncryptionAvailable()) {
        const decryptOddStr = this.safeStorage.decryptString(this.obfuscationOdd);
        odd = Buffer.from(decryptOddStr, "hex");
      }

      const offseted = mergeOddEven(odd, even);
      const masked = revertOffsets(offseted, this.byteOffsetRule);
      const pwdKeyUint8Array = unmaskUint8Array(masked, this.maskInsertRule);
      const pwdKeyWordArray = uint8ArrayToWordArray(Buffer.from(pwdKeyUint8Array));

      const hmac = CryptoJS.HmacSHA256(
        Buffer.concat([
          Buffer.from(masked),
          Buffer.from(offseted),
          Buffer.from(this.obfuscationOdd),
          Buffer.from(this.obfuscationEven)
        ]),
        pwdKeyWordArray
      );

      const crypto = require("crypto");
      const validateResult = crypto.timingSafeEqual(
        wordArrayToUint8Array(hmac),
        wordArrayToUint8Array(this.pwdKeyValidateHMAC)
      );
      if (!validateResult) return undefined;
      console.log("Compare HMAC256Hash True...");
      return pwdKeyWordArray;
    }
    return undefined;
  }

  public async loadWalletKeystores(
    walletKeystores: WalletKeystore[],
    { salt, aes }: { salt: string, aes: any }
  ) {
    const crypto = require('crypto');

    this.cachePwdKey(aes);
    this.salt = salt;
    const pwdKeyWordArray = this.getPwdKey();
    if (!pwdKeyWordArray) return;

    // 为每一个钱包生成随机盐,通过PBKDF2 派生密码密钥,并通过随机IV进行AES加密敏感数据.
    const encryptWalletKeystores = await Promise.all(
      Object.values(walletKeystores).map(async (walletKeystore: any) => {
        const salt = CryptoJS.lib.WordArray.create(crypto.randomBytes(32));
        const iv = CryptoJS.lib.WordArray.random(16);
        const _encryptWalletKeystore = {
          ...walletKeystore,
          salt,
          iv
        } as WalletKeystore;
        await this.encryptWalletKeystore(_encryptWalletKeystore, pwdKeyWordArray);
        return _encryptWalletKeystore;
      })
    );

    // 装配钱包加密数据到索引对象
    this.encryptWalletKeystoreMap = encryptWalletKeystores.reduce((map, encrypteWalletKeystore) => {
      map[encrypteWalletKeystore.address] = encrypteWalletKeystore;
      return map;
    }, {} as {
      [address: string]: WalletKeystore
    });


    return encryptWalletKeystores;
  }

  private async signTransaction(
    activeAccount: string,
    tx: TransactionRequest
  ): Promise<{ signedTx?: string; error?: EtherStructuredError }> {
    const { value, nonce, gasLimit, gasPrice } = tx;
    const transaction: TransactionRequest = {
      ...tx,
      value: value !== undefined ? ethers.BigNumber.from(value) : ethers.constants.Zero,
      nonce: nonce !== undefined ? ethers.BigNumber.from(nonce) : ethers.constants.Zero,
      gasLimit: gasLimit !== undefined ? ethers.BigNumber.from(gasLimit) : ethers.constants.Zero,
      gasPrice: gasPrice !== undefined ? ethers.BigNumber.from(gasPrice) : ethers.constants.Zero,
      from: activeAccount
    };
    try {
      // 用块作用域控制私钥生命周期
      let signedTx: string;
      {
        let decrypted = this.getActiveAccountPrivateKey(activeAccount);
        const signer = new ethers.Wallet(decrypted);
        // 主动释放
        decrypted = "";
        signedTx = await signer.signTransaction({
          ...transaction,
        });
      }
      return { signedTx };
    } catch (err) {
      return { error: wrapEthersError(err) };
    }
  }

  private async signTypedData(activeAccount: string, domain: TypedDataDomain, types: any, message: any) {
    let decrypted = this.getActiveAccountPrivateKey(activeAccount);
    const signer = new ethers.Wallet(decrypted, undefined);
    try {
      return await signer._signTypedData(domain, types, message);
    } finally {
      decrypted = '';
    }
  }

  private async updatePassword(oldPassword: string, newPassword: string) {
    if (!this.salt) return false;
    if (!await this.validatePassword(oldPassword)) return false;
    return await this.regenerateKys(newPassword);
  }

  private async regenerateKys(password?: string) {
    if (Object.keys(this.encryptWalletKeystoreMap).length == 0) return;
    // 遍历 encryptWalletKeystoreMap,将钱包数据全部解密为明文;
    const pwdKeyWordArray = this.getPwdKey();
    const walletKeystores = Object.values(this.encryptWalletKeystoreMap).map(encryptWalletKeystore => {
      return this.decryptWalletKeystore(encryptWalletKeystore, pwdKeyWordArray);
    });

    const result = await scryptEncryWalletKeystores(
      walletKeystores,
      {
        aes: pwdKeyWordArray,
        salt: this.salt
      },
      password
    );
    if (!result) return undefined;

    const { Base58Encode, aes, salt } = result;
    if (password && salt) {
      this.loadWalletKeystores(
        walletKeystores,
        {
          salt,
          aes
        }
      )
    }
    return await this.saveOrUpdateBase58Encode(Base58Encode);
  }

  private async importWallet(mnemonic?: string, _password?: string, _path?: string, privateKey?: string, initWalletPassword?: string) {
    if (!initWalletPassword && Object.keys(this.encryptWalletKeystoreMap).length == 0) {
      return;
    }
    const crypto = require('crypto');
    const salt = CryptoJS.lib.WordArray.create(crypto.randomBytes(32));
    const iv = CryptoJS.lib.WordArray.random(16);

    // 未创建钱包加密文件情况下的第一次创建/导入钱包..
    if (initWalletPassword && Object.keys(this.encryptWalletKeystoreMap).length == 0) {
      ///////////////////////////////////
      console.log("Init Wallet By A Init-Password ...");
      const salt = crypto.randomBytes(32).toString("hex");
      const pwdKeyWordArray = await scryptDrive(initWalletPassword, salt);
      this.salt = salt;
      this.cachePwdKey(pwdKeyWordArray);
      ///////////////////////////////////
    }

    let _walletKeystore = undefined;
    if (mnemonic) {
      const password = _password ?? undefined;
      const path = _path ?? "m/44'/60'/0'/0/" + 0;
      const wallet = HDNode.fromMnemonic(mnemonic, password).derivePath(path);
      _walletKeystore = {
        mnemonic,
        password,
        path,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
        salt,
        iv
      } as WalletKeystore;
    } else if (privateKey) {
      const wallet = new ethers.Wallet(privateKey);
      _walletKeystore = {
        privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
        salt,
        iv
      } as WalletKeystore;
    }
    if (!_walletKeystore) return;

    this.encryptWalletKeystore(_walletKeystore, this.getPwdKey());
    const encryptWalletKeystore = _walletKeystore;
    this.encryptWalletKeystoreMap[encryptWalletKeystore.address] = encryptWalletKeystore;

    if (await this.regenerateKys(initWalletPassword)) {
      return {
        address: _walletKeystore.address,
        publicKey: _walletKeystore.publicKey,
        path: _walletKeystore.path
      }
    }
  }

  private drivePrivateKeyByPath(activeAccount: string, path: string) {
    const encryptWalletKeystore = this.encryptWalletKeystoreMap[activeAccount];
    const { mnemonic, password } = encryptWalletKeystore;
    const [aes, iv] = this.calculateWalletAES(encryptWalletKeystore, this.getPwdKey());
    if (!mnemonic) return undefined;
    let hdNode: HDNode | undefined = undefined;
    {
      let decryptMnemonic = this.decrypt(mnemonic, aes, iv);
      let decryptPassword = password ? this.decrypt(password, aes, iv) : "";
      hdNode = HDNode.fromMnemonic(decryptMnemonic, decryptPassword, undefined)
        .derivePath(path);
      decryptMnemonic = '';
      decryptPassword = '';
    }
    return hdNode.privateKey;
  }

  private decrypt(cipher: string, _aes: string | any, _iv: string | any) {
    const ciphertext = CryptoJS.enc.Hex.parse(cipher);
    const aes = typeof _aes === 'string' ? CryptoJS.enc.Hex.parse(_aes) : _aes;
    const iv = typeof _iv === 'string' ? CryptoJS.enc.Hex.parse(_iv) : _iv;
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aes,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private encrypt(text: string, _aes: string | object, _iv: string) {
    const aes = typeof _aes === 'string' ? CryptoJS.enc.Hex.parse(_aes) : _aes;
    const iv = typeof _iv === 'string' ? CryptoJS.enc.Hex.parse(_iv) : _iv;
    const cipher = CryptoJS.AES.encrypt(
      text, aes,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    ).ciphertext.toString(CryptoJS.enc.Hex);
    return cipher;
  }

  private calculateWalletAES(walletKeystore: WalletKeystore, pwdKeyWordArray: any) {
    const { salt, iv } = walletKeystore;
    return [
      CryptoJS.HmacSHA256(pwdKeyWordArray, salt),
      iv
    ]
  }

  private async encryptWalletKeystore(walletKeystore: WalletKeystore, pwdKeyWordArray: any) {
    const [aes, iv] = this.calculateWalletAES(walletKeystore, pwdKeyWordArray);
    Object.keys(walletKeystore).forEach(prop => {
      switch (prop) {
        case 'mnemonic':
          if (walletKeystore.mnemonic) {
            walletKeystore.mnemonic = this.encrypt(walletKeystore.mnemonic, aes, iv);
          }
          break;
        case 'privateKey':
          walletKeystore.privateKey = this.encrypt(walletKeystore.privateKey, aes, iv);
          break;
        case 'password':
          if (walletKeystore.password) {
            walletKeystore.password = this.encrypt(walletKeystore.password, aes, iv);
          }
          break;
      }
    });
  }

  private decryptWalletKeystore(encryptWalletKeystore: WalletKeystore, pwdKeyWordArray: any) {
    const _walletKeystore = { ...encryptWalletKeystore };
    const [aes, iv] = this.calculateWalletAES(_walletKeystore, pwdKeyWordArray);
    Object.keys(_walletKeystore).forEach(prop => {
      switch (prop) {
        case 'mnemonic':
          if (_walletKeystore.mnemonic) {
            _walletKeystore.mnemonic = this.decrypt(_walletKeystore.mnemonic, aes, iv);
          }
          break;
        case 'privateKey':
          _walletKeystore.privateKey = this.decrypt(_walletKeystore.privateKey, aes, iv);
          break;
        case 'password':
          if (_walletKeystore.password) {
            _walletKeystore.password = this.decrypt(_walletKeystore.password, aes, iv);
          }
          break;
      }
    });

    return _walletKeystore;
  }

  private getActiveAccountPrivateKey(activeAccount: string) {
    const encryptWalletKeystore = this.encryptWalletKeystoreMap[activeAccount];
    const [aes, iv] = this.calculateWalletAES(encryptWalletKeystore, this.getPwdKey())
    const { privateKey } = encryptWalletKeystore;
    return this.decrypt(privateKey, aes, iv);
  }

  private generateNodeChildWallets(activeAccount: string, supportChildWalletType: SupportChildWalletType, _startAddressIndex: number, size: number) {
    const encryptWalletKeystore = this.encryptWalletKeystoreMap[activeAccount];
    if (!encryptWalletKeystore.mnemonic) return;
    const {
      mnemonic, password
    } = encryptWalletKeystore;
    const [aes, iv] = this.calculateWalletAES(encryptWalletKeystore, this.getPwdKey());
    return generateNodeChildWallets(
      this.decrypt(mnemonic, aes, iv),
      password ? this.decrypt(password, aes, iv) : "",
      supportChildWalletType,
      _startAddressIndex, size
    );
  }

  private async validatePassword(password: string): Promise<boolean> {
    if (!this.salt) return false;
    let _pwdKeyWordArray = await scryptDrive(password, this.salt);
    let pwdKeyWordArray = this.getPwdKey();
    try {
      if (!_pwdKeyWordArray || !pwdKeyWordArray) return false;
      return CryptoJS.enc.Hex.stringify(_pwdKeyWordArray) === CryptoJS.enc.Hex.stringify(pwdKeyWordArray);
    } finally {
      // 重置变量引用,加速回收
      _pwdKeyWordArray = undefined;
      pwdKeyWordArray = undefined;
    }
  }

  private async viewMnemonic(walletAddress: string, pwd: string) {
    if (! await this.validatePassword(pwd)) return undefined;
    let pwdKeyWordArray = this.getPwdKey();
    const [aes, iv] = this.calculateWalletAES(this.encryptWalletKeystoreMap[walletAddress], pwdKeyWordArray);
    const { mnemonic, password, path } = this.encryptWalletKeystoreMap[walletAddress];
    try {
      return [
        mnemonic ? this.decrypt(mnemonic, aes, iv) : undefined,
        password ? this.decrypt(password, aes, iv) : undefined,
        path
      ];
    } finally {
      pwdKeyWordArray = undefined;
    }
  }

  private async viewPrivateKey(walletAddress: string, pwd: string) {
    if (!await this.validatePassword(pwd)) return undefined;
    return this.getActiveAccountPrivateKey(walletAddress);
  }

  private async viewKeystore(walletAddress: string, pwd: string) {
    if (!this.validatePassword(pwd)) return undefined;
    let privateKey = this.getActiveAccountPrivateKey(walletAddress);
    const ethersWallet = new ethers.Wallet(privateKey);
    privateKey = '';
    const keystore = await ethersWallet.encrypt(pwd);
    return keystore;
  }

  private async clean() {
    this.salt = undefined;
    this.maskInsertRule = undefined;
    this.byteOffsetRule = undefined;
    this.obfuscationOdd = undefined;
    this.obfuscationEven = undefined;
    this.pwdKeyValidateHMAC = undefined;
    this.encryptWalletKeystoreMap = {};
    console.log("Clean Wallet-IPC | *** | ")
  }

  // **** DB **** //
  private async loadKysFromDB() {
    const queryPromise = new Promise<any>((resolve, reject) => {
      this.kysDB.all("SELECT * from wallet_kys limit 1", [],
        (err: any, rows: any) => {
          resolve(rows);
        })
    });
    const rows = await queryPromise;
    if (rows.length > 0) {
      const Base58Encode = rows[0].data;
      return Base58Encode;
    }
    return undefined;
  }
  // **** DB **** //
  private async saveOrUpdateBase58Encode(Base58Encode: string) {
    const dbUpdatePromise = new Promise((resolve, reject) => {
      this.kysDB.all("SELECT * FROM wallet_kys", [], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows && rows.length > 0) {
          console.log("[sqlite3-kys] UPDATE for stored.")
          this.kysDB.run("UPDATE wallet_kys set data = ?", [Base58Encode], (err: any, rows: any) => {
            if (!err) {
              resolve(rows);
            }
          })
        } else {
          console.log("[sqlite3-kys] INSERT for stored.")
          this.kysDB.run("INSERT INTO wallet_kys(data) VALUES(?)", [Base58Encode], (err: any, rows: any) => {
            if (!err) {
              resolve(rows);
            }
          })
        }
      })
    });
    try {
      await dbUpdatePromise;
      return true;
    } catch (err) {
      console.log("saveOrUpdate Base58Encode Error :", err)
      return false;
    }
  }
}

export function wrapEthersError(err: any): EtherStructuredError {
  return {
    name: err?.name || "Error",
    message: err?.message || "Unknown error",
    reason: err?.reason,
    code: err?.code,
    stack: err?.stack,

    method: err?.method,
    transaction: err?.transaction,
    version: err?.version,

    url: err?.url,
    requestMethod: err?.requestMethod,
    requestBody: err?.requestBody,
    responseBody: err?.body,
    error: err?.error,
  };
}

export interface WalletKeystore {

  salt: any,
  iv: any,

  mnemonic?: string,
  password?: string,
  path?: string,
  privateKey: string,
  publicKey: string,
  address: string

}

export interface EtherStructuredError {
  name: string;
  message: string;
  reason?: string;
  code?: string;
  stack?: string;

  // ethers-specific
  method?: string;
  transaction?: any;
  version?: string;

  // JSON-RPC context
  url?: string;
  requestMethod?: string;
  requestBody?: string;
  responseBody?: string;

  // inner JSON-RPC error object
  error?: any;
}

// 字节偏移规则
export interface ByteOffsetRule {
  positions: Uint32Array;     // 替换位置
  values: Uint8Array;         // 偏移值
}

// 掩码插入规则类型
export interface MaskInsertRule {
  positions: number[];        // 插入位置（基于原始数据）
  values: number[][];         // 对应位置插入的字节数据
}

/**
 * 生成掩码插入规则
 * @param originalLength 原始 Uint8Array 长度
 * @param insertCount 插入点数量（不能超过 originalLength + 1）
 * @returns MaskInsertRule
 */
export function createMaskInsertRule(originalLength: number, insertCount: number): MaskInsertRule {
  if (insertCount > originalLength + 1) {
    throw new Error("Insert count cannot exceed original length + 1");
  }

  // 构造所有可能的插入位置（在每个原字节之间插入，包括头尾）
  const possiblePositions = Array.from({ length: originalLength + 1 }, (_, i) => i);

  // 使用 Fisher-Yates 洗牌随机选取插入点
  for (let i = possiblePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
  }

  const selectedPositions = possiblePositions.slice(0, insertCount).sort((a, b) => a - b);
  const insertedValues = selectedPositions.map(() => {
    const byteCount = Math.floor(Math.random() * 6) + 1; // 插入 1~6 个随机字节
    return Array.from({ length: byteCount }, () => Math.floor(Math.random() * 256));
  });

  return {
    positions: selectedPositions,
    values: insertedValues
  };
}

/**
 * 根据插入规则对原始数据进行掩码插入
 */
export function maskUint8Array(original: Uint8Array, rule: MaskInsertRule): Uint8Array {
  const { positions, values } = rule;

  const totalInsertLength = values.reduce((sum, v) => sum + v.length, 0);
  const masked = new Uint8Array(original.length + totalInsertLength);

  let oIndex = 0, mIndex = 0, pIndex = 0;

  for (let i = 0; i <= original.length; i++) {
    if (pIndex < positions.length && positions[pIndex] === i) {
      masked.set(values[pIndex], mIndex);
      mIndex += values[pIndex].length;
      pIndex++;
    }
    if (i < original.length) {
      masked[mIndex++] = original[oIndex++];
    }
  }
  return masked;
}

/**
 * 还原掩码插入后的数据
 */
export function unmaskUint8Array(masked: Uint8Array, rule: MaskInsertRule): Uint8Array {
  const { positions, values } = rule;

  const insertLengths = values.map(v => v.length);
  const totalInsertLength = insertLengths.reduce((sum, len) => sum + len, 0);
  const originalLength = masked.length - totalInsertLength;
  const restored = new Uint8Array(originalLength);

  // 计算插入偏移量的实际位置（因前面已插入其他字节，所以要偏移）
  const adjustedOffsets = positions.map((pos, index) => {
    const offsetAdjustment = insertLengths.slice(0, index).reduce((sum, len) => sum + len, 0);
    return pos + offsetAdjustment;
  });

  let rIndex = 0, mIndex = 0, skipIndex = 0;

  while (mIndex < masked.length) {
    if (skipIndex < adjustedOffsets.length && mIndex === adjustedOffsets[skipIndex]) {
      mIndex += values[skipIndex].length; // 跳过插入数据
      skipIndex++;
    } else {
      restored[rIndex++] = masked[mIndex++];
    }
  }

  return restored;
}

export function createOffsetRule(length: number, count: number): ByteOffsetRule {
  const positions = new Uint32Array(count);
  const values = new Uint8Array(count);
  const used = new Uint8Array(length);

  for (let i = 0; i < count;) {
    const pos = Math.floor(Math.random() * length);
    if (!used[pos]) {
      used[pos] = 1;
      positions[i] = pos;
      values[i] = Math.floor(Math.random() * 254) + 1; // 1~254
      i++;
    }
  }
  // Uint32Array 没有内置 sort，需要先转成普通数组排序再赋值
  const sortedPositions = Array.from(positions).sort((a, b) => a - b);
  for (let i = 0; i < count; i++) {
    positions[i] = sortedPositions[i];
  }

  return { positions, values };
}

export function applyOffsets(input: Uint8Array, rule: ByteOffsetRule): Uint8Array {
  const output = new Uint8Array(input);
  const { positions, values } = rule;

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    output[pos] = (output[pos] + values[i]) & 0xff;
  }
  return output;
}

export function revertOffsets(input: Uint8Array, rule: ByteOffsetRule): Uint8Array {
  const output = new Uint8Array(input);
  const { positions, values } = rule;

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    output[pos] = (output[pos] - values[i] + 256) & 0xff;
  }
  return output;
}


/**
 * 将 Uint8Array 按奇偶位分组
 * @param data 输入的 Uint8Array
 * @returns [奇数位数组, 偶数位数组]
 */
function splitByOddEven(data: Uint8Array): [Buffer, Buffer] {
  const odd: number[] = [];
  const even: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i % 2 === 0) {
      even.push(data[i]);
    } else {
      odd.push(data[i]);
    }
  }

  return [Buffer.from(odd), Buffer.from(even)];
}

/**
 * 合并奇偶位数组还原原始Uint8Array
 * @param odd 奇数位数组
 * @param even 偶数位数组
 * @returns 合并后的完整数组
 */
function mergeOddEven(odd: Buffer, even: Buffer): Uint8Array {
  const totalLength = odd.length + even.length;
  const result = new Uint8Array(totalLength);
  let oddIndex = 0;
  let evenIndex = 0;
  for (let i = 0; i < totalLength; i++) {
    if (i % 2 === 0) {
      result[i] = even[evenIndex++];
    } else {
      result[i] = odd[oddIndex++];
    }
  }
  return result;
}


