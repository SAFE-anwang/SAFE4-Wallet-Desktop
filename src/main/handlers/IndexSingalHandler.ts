import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
import { Wallet_Keystore_FileName } from "./WalletSignalHandler";
const fs = require("fs");

export const IndexSingal = "index";

export class IndexSingalHandler implements ListenSignalHandler {


  constructor(){

  }

  getSingal(): string {
    return IndexSingal;
  }

  handleOn(event: Electron.IpcMainEvent, ...args: any[]): void {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if ( method == "load" ){
      data = this.load();
    }
    event.reply(Channel, [this.getSingal(), method , [data] ])
  }

  private load() : any {
    const walletsList = this.loadWallet();
    return {
      walletsList
    }
  }

  private loadWallet() : any {
    let walletsList : any[] = [];
    let safe4walletKeyStoresContent = undefined;
    try{
      safe4walletKeyStoresContent =  fs.readFileSync( Wallet_Keystore_FileName  , "utf8");
    }catch(err){
      console.error(`No ${Wallet_Keystore_FileName} found`)
    }
    try{
      if ( safe4walletKeyStoresContent ){
        walletsList = JSON.parse(safe4walletKeyStoresContent);
        if ( ! (walletsList instanceof Array) ){
          console.error(`${Wallet_Keystore_FileName} 损坏`);
        }
      }
    }catch(err){
      console.error(`${Wallet_Keystore_FileName} 损坏`);
    }
    return walletsList;
  }

}
