import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import { ethers, Wallet } from "ethers";

const CryptoJS = require('crypto-js');

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

export class WalletIpc {

  encryptWalletKeystoreMap: {
    [address: string]: WalletKeystore
  } = {};

  constructor(ipcMain: any) {
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
  }

  public loadEncryptWalletKeystores(
    encryptWalletKeystores: WalletKeystore[],
  ) {
    this.encryptWalletKeystoreMap = encryptWalletKeystores.reduce((map, walletKeystore) => {
      map[walletKeystore.address] = walletKeystore;
      return map;
    }, {} as {
      [address: string]: WalletKeystore
    });
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
        console.log("decrypted:", decrypted)
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

  private getActiveAccountPrivateKey(activeAccount: string) {
    const { privateKey, _aes, _iv } = this.encryptWalletKeystoreMap[activeAccount];
    return this.decrypt(privateKey, _aes, _iv);
  }

  private decrypt(encrypt: string, _aes: string, _iv: string) {
    const ciphertext = CryptoJS.enc.Hex.parse(encrypt);
    const aes = CryptoJS.enc.Hex.parse(_aes);
    const iv = CryptoJS.enc.Hex.parse(_iv);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aes,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  private validatePassword(walletAddress: string, password: string) {
    const { _aes, _salt } = this.encryptWalletKeystoreMap[walletAddress];
    const derivedKey = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(_salt), {
      keySize: 256 / 32,
      iterations: 10000
    });
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
