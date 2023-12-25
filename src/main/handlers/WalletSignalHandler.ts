import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
import * as bip39 from 'bip39';
const fs = require('fs');

export const WalletSignal = "wallet";

export const Wallet_Keystore_FileName = "safe4wallet.keystores";

export class WalletSignalHandler implements ListenSignalHandler {

  constructor() {

  }

  getSingal(): string {
    return WalletSignal;
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if ("generateMnemonic" == method) {
      data = bip39.generateMnemonic();
    } else if ("generateWallet" == method) {
      const secp256k1 = require("tiny-secp256k1");
      const { BIP32Factory } = require("bip32");
      const bip32 = BIP32Factory(secp256k1);
      const util = require("ethereumjs-util");
      const mnemonic = params[0];
      const password = params[1];
      // 使用助记词和密码基于 BIP39 生成种子私钥
      const seed = await bip39.mnemonicToSeedSync(mnemonic, password);
      // 使用种子作为 bip32:HDWallet 根节点
      const root = bip32.fromSeed(seed);
      console.log(`BIP 32 ROOT KEY    :${root.toBase58()}`);
      // 使用 bip44 定义的钱包拓展协议生成地址
      const path = "m/44'/60'/0'/0/" + 0;
      const keyPair = root.derivePath(path);
      const privateKey = util.bufferToHex(keyPair.privateKey);
      const publicKey = util.bufferToHex(keyPair.publicKey);
      // 将公钥按eth地址标准转为16进制
      let address = util.bufferToHex(util.pubToAddress(keyPair.publicKey, true));
      // 再将地址进行 checksum 转换一次
      address = util.toChecksumAddress(address.toString('hex'))
      data = {
        mnemonic,
        path,
        privateKey,
        publicKey,
        address
      }
    } else if ("restoreWallet" == method) {
      const walletList = params[0];
      const content = JSON.stringify(walletList);
      await fs.writeFileSync(Wallet_Keystore_FileName, content, 'utf8');
      data = {
        success : true ,
        path : ""
      }
      console.log("restoreWallet finished!")
    }
    console.log("data =>" , data)
    event.reply(Channel, [this.getSingal(), method , [data] ])
  }



}
