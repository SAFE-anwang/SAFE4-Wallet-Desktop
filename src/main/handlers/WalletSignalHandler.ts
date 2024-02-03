import { ethers } from "ethers";
import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";
import * as bip39 from 'bip39';
import { base58 } from "ethers/lib/utils";
const fs = require('fs');

export const WalletSignal = "wallet";
export const Wallet_Keystore_FileName = "safe4wallet.keystores.json";

export enum Wallet_Methods {
  generateMnemonic = "generateMnemonic",
  generateWallet = "generateWallet",
  storeWallet = "storeWallet"
}

export class WalletSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return WalletSignal;
  }
  ctx : Context
  constructor( ctx : Context ) {
    this.ctx = ctx;
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (Wallet_Methods.generateMnemonic == method) {
      data = this.generateMnemonic();
    } else if (Wallet_Methods.generateWallet == method) {
      try{
        data = await this.gennerateWallet(params);
      }catch( err : any ){
        data = err;
      }
    } else if (Wallet_Methods.storeWallet == method) {
      data = await this.storeWallet(params);
    }
    event.reply(Channel, [this.getSingal(), method, [data]])
  }

  private generateMnemonic() {
    return bip39.generateMnemonic();
  }

  private async storeWallet( params: any[] ){
    const walletList = params[0];
    // walletList.push({
    //   privateKey:"0xac44aa658f3443c6c80a6197596501a683a7f715a41b469fdd76410db46addc3",
    //   publicKey:"0x8b96c90b86cfdbdc971bb54c263a6d021e7f4894",
    //   address:"0x8b96C90B86CFDBdc971bb54C263a6d021e7f4894"
    // })
    // walletList.push({
    //   privateKey:"0x0fc4e0fe5cf4482ee2cc48bba0241dafb015dc5215bd29a222a1bd3c9e14c959",
    //   publicKey:"0x044f9c93b57efaa547f8461d4fa864eb40558cd0",
    //   address:"0x044f9C93b57eFAA547F8461d4FA864eb40558cD0"
    // })
    const content = JSON.stringify(walletList);
    try{
      const base58EncodeContent = base58.encode(new Buffer(content , "utf-8"));
      await fs.writeFileSync( this.ctx.path.keystores, base58EncodeContent, 'utf8');
      return {
        success: true,
        path: Wallet_Keystore_FileName
      }
    }catch( err : any ){
      return {
        success : false,
        reason : err
      }
    }
  }

  private async gennerateWallet( params: any[] ) {
    const mnemonic = params[0];
    const password = params[1];
    const path = "m/44'/60'/0'/0/" + 0;
    const wallet = ethers.Wallet.fromMnemonic(mnemonic,path);
    const { privateKey , publicKey , address } = wallet;
    return {
      mnemonic,
      path,
      privateKey,
      publicKey,
      address
    }
  }

  // private async gennerateWallet( params: any[] ) {
  //   const secp256k1 = require("tiny-secp256k1");
  //   const { BIP32Factory } = require("bip32");
  //   const bip32 = BIP32Factory(secp256k1);
  //   const util = require("ethereumjs-util");
  //   const mnemonic = params[0];
  //   const password = params[1];
  //   // 使用助记词和密码基于 BIP39 生成种子私钥
  //   const seed = await bip39.mnemonicToSeedSync(mnemonic, password);
  //   // 使用种子作为 bip32:HDWallet 根节点
  //   const root = bip32.fromSeed(seed);
  //   // console.log(`BIP 32 ROOT KEY    :${root.toBase58()}`);
  //   // 使用 bip44 定义的钱包拓展协议生成地址
  //   const path = "m/44'/60'/0'/0/" + 0;
  //   const keyPair = root.derivePath(path);
  //   const privateKey = util.bufferToHex(keyPair.privateKey);
  //   const publicKey = util.bufferToHex(keyPair.publicKey);
  //   // 将公钥按eth地址标准转为16进制
  //   let address = util.bufferToHex(util.pubToAddress(keyPair.publicKey, true));
  //   // 再将地址进行 checksum 转换一次
  //   address = util.toChecksumAddress(address.toString('hex'))
  //   return {
  //     mnemonic,
  //     path,
  //     privateKey,
  //     publicKey,
  //     address
  //   }
  // }

}
