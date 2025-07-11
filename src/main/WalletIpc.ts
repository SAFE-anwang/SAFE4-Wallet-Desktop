import { JsonRpcProvider, TransactionRequest } from "@ethersproject/providers";
import { ethers } from "ethers";

const CryptoJS = require('crypto-js');

export interface WalletKeystore {
  mnemonic?: string,
  path?: string,
  privateKey: string,
  publicKey: string,
  address: string
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

  private async signTransaction(activeAccount: string, providerUrl: string, tx: TransactionRequest) {

    const privateKey = this.getActiveAccountPrivateKey(activeAccount);
    const provider = new JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const { value } = tx;

    const transaction = {
      ...tx,
      value: value !== undefined ? ethers.BigNumber.from(value) : ethers.constants.Zero,
    };

    return signer.signTransaction({
      ...transaction,
      nonce: await provider.getTransactionCount(signer.address),
      gasLimit: transaction.gasLimit ? ethers.BigNumber.from(transaction.gasLimit) : await provider.estimateGas(transaction),
      gasPrice: transaction.gasPrice ? ethers.BigNumber.from(transaction.gasPrice) : await provider.getGasPrice(),
      chainId: transaction.chainId ?? (await provider.getNetwork()).chainId
    });

  }

  private getActiveAccountPrivateKey(activeAccount: string) {
    console.log(activeAccount);
    console.log(this.encryptWalletKeystoreMap);
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
