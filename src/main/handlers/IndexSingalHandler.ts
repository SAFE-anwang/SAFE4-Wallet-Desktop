import { app } from "electron";
import { ApplicationIpcManager, Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
import { Wallet_Keystore_FileName } from "./WalletSignalHandler";
import { Context } from "./Context";
const fs = require("fs");

export const IndexSingal = "index";

export enum Index_Methods {
  load = "load"
}

export class IndexSingalHandler implements ListenSignalHandler {

  getSingal(): string {
    return IndexSingal;
  }

  private db : any;
  private ctx : Context;

  public getSqlite3DB() : any{
    return this.db;
  }

  constructor( ctx : Context , DBConnectedCallback : () => void ){
    this.ctx = ctx;
    const sqlite3 = require('sqlite3').verbose();
    // const dbPath = ctx.resourcePath + "assets/wallet.db";
    const dbPath = "C:\\Users\\Administrator\\AppData\\Local\\Programs\\electron-react-boilerplate\\resources\\assets\\wallet.db";
    console.log("[sqlite3] Connect DB path :" ,dbPath)
    this.db = new sqlite3.Database(
      dbPath,
      function (err: any) {
        if (err) {
          return;
        }
        console.log("Connect sqlite3 successed.")
        DBConnectedCallback();
      }
    )
  }

  handleOn(event: Electron.IpcMainEvent, ...args: any[]): void {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if ( method == Index_Methods.load ){
      data = this.load();
    }
    event.reply(Channel, [this.getSingal(), method , [data] ])
  }

  private load() : any {
    const walletKeystores = this.loadWalletKeystores();
    return {
      nodeServerPath : process.cwd(),
      resourcePath : this.ctx.resourcePath,
      walletKeystores
    }
  }

  private loadWalletKeystores() : any {
    let walletKeystores : any[] = [];
    let safe4walletKeyStoresContent = undefined;
    try{
      safe4walletKeyStoresContent = fs.readFileSync(
        this.ctx.resourcePath + Wallet_Keystore_FileName  , "utf8");
    }catch(err){
      console.error(`No ${Wallet_Keystore_FileName} found`)
    }
    try{
      if ( safe4walletKeyStoresContent ){
        walletKeystores = JSON.parse(safe4walletKeyStoresContent);
        if ( ! (walletKeystores instanceof Array) ){
          console.error(`${Wallet_Keystore_FileName} 损坏`);
        }
      }
    }catch(err){
      console.error(`${Wallet_Keystore_FileName} 损坏`);
    }
    console.log(`Finish Load ${Wallet_Keystore_FileName}`)
    return walletKeystores;
  }

}
