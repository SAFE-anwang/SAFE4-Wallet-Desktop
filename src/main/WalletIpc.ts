import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import { ethers, Wallet } from "ethers";

const CryptoJS = require('crypto-js');

export interface WalletKeystore {
  mnemonic?: string,
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

  _iv: string | undefined = undefined;
  _aesKey: string | undefined = undefined;

  encryptWalletKeystoreMap: {
    [address: string]: WalletKeystore
  } = {};

  encryptWalletKeystores: WalletKeystore[] = []

  constructor(ipcMain: any) {
    ipcMain.handle("wallet-signTransaction", async (event: any, _params: any) => {
      const [activeAccount, providerUrl, params] = _params;
      return this.signTransaction(activeAccount, providerUrl, params);
    })
  }

  public loadEncryptWalletKeystores(
    encryptWalletKeystores: WalletKeystore[],
    _iv: string,
    _aesKey: string
  ) {
    this._iv = _iv;
    this._aesKey = _aesKey;
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
    const encrypt = this.encryptWalletKeystoreMap[activeAccount].privateKey;
    return this.decrypt(encrypt);
  }

  private decrypt(encrypt: string) {
    const ciphertext = CryptoJS.enc.Hex.parse(encrypt);
    const aesKey = CryptoJS.enc.Hex.parse(this._aesKey);
    const iv = CryptoJS.enc.Hex.parse(this._iv);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      aesKey,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
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
