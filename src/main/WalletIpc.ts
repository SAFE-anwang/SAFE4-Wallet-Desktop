import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { scryptDecryptWalletKys, scryptDrive, scryptEncryWalletKeystores } from "./CryptoIpc";

const CryptoJS = require('crypto-js');

const PBKDF2_Config = {
  keySize: 256 / 32,
  iterations: 10000
}

export class WalletIpc {

  salt: string | undefined;
  _aes: string | undefined;

  private kysDB: any;

  encryptWalletKeystoreMap: {
    [address: string]: WalletKeystore
  } = {};

  constructor(ipcMain: any, kysDB: any) {
    ipcMain.handle("wallet-signTransaction", async (event: any, _params: any) => {
      const [activeAccount, providerUrl, params] = _params;
      return this.signTransaction(activeAccount, providerUrl, params);
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

    this.kysDB = kysDB;
  }

  private async decryptKys(password: string) {
    const Base58Encode = await this.loadKysFromDB();
    if (!Base58Encode) return;
    const {
      walletKeystores,
      _aes,
      salt
    } = await scryptDecryptWalletKys(Base58Encode, password);
    const encryptWalletKeystores = this.loadWalletKeystores(walletKeystores, password, { _aes, salt })
    const wallets = encryptWalletKeystores.map(encryptWalletKeystore => {
      const { publicKey, address, path } = encryptWalletKeystore;
      return {
        publicKey, address, path
      }
    });
    return wallets;
  }

  public loadWalletKeystores(
    walletKeystores: WalletKeystore[],
    password: string,
    { salt, _aes }: { salt: string, _aes: string }
  ) {
    const crypto = require('crypto');
    // 为每一个钱包生成随机盐,通过PBKDF2 派生密码密钥,并通过随机IV进行AES加密敏感数据.
    const encryptWalletKeystores = Object.values(walletKeystores).map((walletKeystore: any) => {
      const salt = CryptoJS.lib.WordArray.create(crypto.randomBytes(32));
      const aes = CryptoJS.PBKDF2(password, salt, PBKDF2_Config);
      const iv = CryptoJS.lib.WordArray.random(16);
      const _encryptWalletKeystore = {
        ...walletKeystore,
        _salt: CryptoJS.enc.Hex.stringify(salt),
        _aes: CryptoJS.enc.Hex.stringify(aes),
        _iv: CryptoJS.enc.Hex.stringify(iv)
      } as WalletKeystore;
      this.encryptWalletKeystore(_encryptWalletKeystore);
      return _encryptWalletKeystore;
    });
    // 装配钱包加密数据到索引对象
    this.encryptWalletKeystoreMap = encryptWalletKeystores.reduce((map, encrypteWalletKeystore) => {
      map[encrypteWalletKeystore.address] = encrypteWalletKeystore;
      return map;
    }, {} as {
      [address: string]: WalletKeystore
    });
    this.salt = salt;
    this._aes = _aes;
    return encryptWalletKeystores;
  }

  private async signTransaction(
    activeAccount: string,
    providerUrl: string,
    tx: TransactionRequest
  ): Promise<{ signedTx?: string; error?: EtherStructuredError }> {
    const provider = new JsonRpcProvider(providerUrl);
    const { value } = tx;
    const transaction: TransactionRequest = {
      ...tx,
      value: value !== undefined ? ethers.BigNumber.from(value) : ethers.constants.Zero,
    };

    try {

      let nonce: number;
      let gasPrice: ethers.BigNumber;
      let gasLimit: ethers.BigNumber;
      let chainId: number;

      [nonce, gasPrice, chainId, gasLimit] = await Promise.all([
        provider.getTransactionCount(activeAccount, "pending"),
        transaction.gasPrice ? Promise.resolve(ethers.BigNumber.from(transaction.gasPrice)) : provider.getGasPrice(),
        transaction.chainId ? Promise.resolve(transaction.chainId) : provider.getNetwork().then((net) => net.chainId),
        transaction.gasLimit ? Promise.resolve(ethers.BigNumber.from(transaction.gasLimit)) : provider.estimateGas({
          ...transaction,
          from: activeAccount
        })
      ]);

      // 用块作用域控制私钥生命周期
      let signedTx: string;
      {
        let decrypted = this.getActiveAccountPrivateKey(activeAccount);
        const signer = new ethers.Wallet(decrypted, provider);
        // 主动释放
        decrypted = "";
        signedTx = await signer.signTransaction({
          ...transaction,
          nonce,
          gasPrice,
          gasLimit,
          chainId,
        });
      }

      return { signedTx };
    } catch (err) {
      return { error: wrapEthersError(err) };
    }
  }

  private async updatePassword(oldPassword: string, newPassword: string) {
    if (!this.salt) return false;
    let validateWalletsPassword = false;
    const drvied = await scryptDrive(oldPassword, this.salt);
    validateWalletsPassword = CryptoJS.enc.Hex.stringify(drvied) === this._aes;
    if (!validateWalletsPassword) return false;
    return await this.regenerateKys(newPassword);
  }

  private async regenerateKys(password?: string) {
    if (Object.keys(this.encryptWalletKeystoreMap).length == 0) return;
    // 遍历 encryptWalletKeystoreMap,将钱包数据全部解密为明文;
    const walletKeystores = Object.values(this.encryptWalletKeystoreMap).map(encryptWalletKeystore => {
      return this.decryptWalletKeystore(encryptWalletKeystore);
    });
    const result = await scryptEncryWalletKeystores(
      walletKeystores,
      {
        _aes: this._aes,
        salt: this.salt
      },
      password
    );
    if (!result) return undefined;
    const { Base58Encode, _aes, salt } = result;
    if (password && salt) {
      this.loadWalletKeystores(
        walletKeystores,
        password,
        {
          salt,
          _aes
        }
      )
    }
    return await this.saveOrUpdateBase58Encode(Base58Encode);
  }

  private async importWallet(mnemonic?: string, _password?: string, _path?: string, privateKey?: string, initWalletPassword?: string) {
    if (!initWalletPassword && Object.keys(this.encryptWalletKeystoreMap).length == 0) {
      return;
    }
    let aes = undefined;
    let salt = undefined;
    const iv = CryptoJS.lib.WordArray.random(16);
    // 未创建钱包加密文件情况下的第一次创建/导入钱包..
    if (initWalletPassword && Object.keys(this.encryptWalletKeystoreMap).length == 0) {
      console.log("Init Wallet By A New Password...");
      const crypto = require('crypto');
      salt = CryptoJS.lib.WordArray.create(crypto.randomBytes(32));
      aes = CryptoJS.PBKDF2(initWalletPassword, salt, PBKDF2_Config);
    } else if (Object.keys(this.encryptWalletKeystoreMap).length > 0) {
      // 已创建钱包加密文件的情况下创建/导入钱包..
      // 使用上一个钱包中的生成的加密参数,下一次重新解锁钱包后,再为每个钱包分配不同的 _salt,_aes
      const walletAddresses = Object.keys(this.encryptWalletKeystoreMap);
      const { _aes, _salt } = this.encryptWalletKeystoreMap[walletAddresses[walletAddresses.length - 1]];
      salt = CryptoJS.enc.Hex.parse(_salt);
      aes = CryptoJS.enc.Hex.parse(_aes);
      console.log("Import Wallet Using prev [Encrypt-salt/aes]");
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
        _salt: CryptoJS.enc.Hex.stringify(salt),
        _aes: CryptoJS.enc.Hex.stringify(aes),
        _iv: CryptoJS.enc.Hex.stringify(iv)
      } as WalletKeystore;
    } else if (privateKey) {
      const wallet = new ethers.Wallet(privateKey);
      _walletKeystore = {
        privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
        _salt: CryptoJS.enc.Hex.stringify(salt),
        _aes: CryptoJS.enc.Hex.stringify(aes),
        _iv: CryptoJS.enc.Hex.stringify(iv)
      } as WalletKeystore;
    }
    if (!_walletKeystore) return;
    this.encryptWalletKeystore(_walletKeystore);
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

  private decrypt(cipher: string, _aes: string, _iv: string) {
    const ciphertext = CryptoJS.enc.Hex.parse(cipher);
    const aes = CryptoJS.enc.Hex.parse(_aes);
    const iv = CryptoJS.enc.Hex.parse(_iv);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aes,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private encrypt(text: string, _aes: string, _iv: string) {
    const aes = CryptoJS.enc.Hex.parse(_aes);
    const iv = CryptoJS.enc.Hex.parse(_iv);
    const cipher = CryptoJS.AES.encrypt(
      text, aes,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    ).ciphertext.toString(CryptoJS.enc.Hex);
    return cipher;
  }

  private encryptWalletKeystore(walletKeystore: WalletKeystore) {
    const { _aes, _iv } = walletKeystore;
    Object.keys(walletKeystore).forEach(prop => {
      switch (prop) {
        case 'mnemonic':
          if (walletKeystore.mnemonic) {
            walletKeystore.mnemonic = this.encrypt(walletKeystore.mnemonic, _aes, _iv);
          }
          break;
        case 'privateKey':
          walletKeystore.privateKey = this.encrypt(walletKeystore.privateKey, _aes, _iv);
          break;
        case 'password':
          if (walletKeystore.password) {
            walletKeystore.password = this.encrypt(walletKeystore.password, _aes, _iv);
          }
          break;
      }
    });
  }

  private decryptWalletKeystore(encryptWalletKeystore: WalletKeystore) {
    const _walletKeystore = { ...encryptWalletKeystore };
    const { _aes, _iv } = _walletKeystore;
    Object.keys(_walletKeystore).forEach(prop => {
      switch (prop) {
        case 'mnemonic':
          if (_walletKeystore.mnemonic) {
            _walletKeystore.mnemonic = this.decrypt(_walletKeystore.mnemonic, _aes, _iv);
          }
          break;
        case 'privateKey':
          _walletKeystore.privateKey = this.decrypt(_walletKeystore.privateKey, _aes, _iv);
          break;
        case 'password':
          if (_walletKeystore.password) {
            _walletKeystore.password = this.decrypt(_walletKeystore.password, _aes, _iv);
          }
          break;
      }
    });
    return _walletKeystore;
  }



  private getActiveAccountPrivateKey(activeAccount: string) {
    const { privateKey, _aes, _iv } = this.encryptWalletKeystoreMap[activeAccount];
    return this.decrypt(privateKey, _aes, _iv);
  }

  private validatePassword(walletAddress: string, password: string) {
    const { _aes, _salt } = this.encryptWalletKeystoreMap[walletAddress];
    const derivedKey = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(_salt), PBKDF2_Config);
    return derivedKey.toString(CryptoJS.enc.Hex) === _aes;
  }

  private viewMnemonic(walletAddress: string, pwd: string) {
    if (!this.validatePassword(walletAddress, pwd)) return undefined;
    const { _aes, _iv, mnemonic, password, path } = this.encryptWalletKeystoreMap[walletAddress];
    return [
      mnemonic ? this.decrypt(mnemonic, _aes, _iv) : undefined,
      password ? this.decrypt(password, _aes, _iv) : undefined,
      path
    ];
  }

  private viewPrivateKey(walletAddress: string, pwd: string) {
    if (!this.validatePassword(walletAddress, pwd)) return undefined;
    return this.getActiveAccountPrivateKey(walletAddress);
  }

  private async viewKeystore(walletAddress: string, pwd: string) {
    if (!this.validatePassword(walletAddress, pwd)) return undefined;
    let privateKey = this.getActiveAccountPrivateKey(walletAddress);
    const ethersWallet = new ethers.Wallet(privateKey);
    privateKey = '';
    const keystore = await ethersWallet.encrypt(pwd);
    return keystore;
  }

  private async clean() {
    console.log("Clean Wallets...")
    this._aes = undefined;
    this.salt = undefined;
    this.encryptWalletKeystoreMap = {};
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

  _salt: string,
  _aes: string
  _iv: string,

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
