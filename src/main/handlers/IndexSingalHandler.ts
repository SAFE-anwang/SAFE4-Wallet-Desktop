import {  Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
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
    const database = ctx.path.database;
    console.log("[sqlite3] Connect DB path :" ,database)
    this.db = new sqlite3.Database(
      database,
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
      path : this.ctx.path,
      walletKeystores
    }
  }

  private loadWalletKeystores() : any {
    let walletKeystores : any[] = [];
    let safe4walletKeyStoresContent = undefined;
    try{
      safe4walletKeyStoresContent = fs.readFileSync(
        this.ctx.path.keystores , "utf8");
    }catch(err){
      console.error(`No ${ this.ctx.path.keystores } found`)
    }
    try{
      if ( safe4walletKeyStoresContent ){
        walletKeystores = JSON.parse(safe4walletKeyStoresContent);
        if ( ! (walletKeystores instanceof Array) ){
          console.error(`${this.ctx.path.keystores} 损坏`);
        }
      }
    }catch(err){
      console.error(`${this.ctx.path.keystores} 损坏`);
    }
    console.log(`Finish Load ${this.ctx.path.keystores}`)
    return walletKeystores;
  }

}
