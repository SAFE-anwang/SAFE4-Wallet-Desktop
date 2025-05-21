import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
import { Context } from "./Context";
import { ethers } from "ethers";

const fs = require("fs");
export const IndexSingal = "index";

export enum Index_Methods {
  load = "load"
}

export class IndexSingalHandler implements ListenSignalHandler {

  getSingal(): string {
    return IndexSingal;
  }
  private db: any;
  private kysDB: any;
  private ctx: Context;

  public getSqlite3DB(): any {
    return this.db;
  }

  public getSqliteKys(): any {
    return this.kysDB;
  }

  constructor(ctx: Context, DBConnectedCallback: () => void) {
    this.ctx = ctx;
    const sqlite3 = require('sqlite3').verbose();
    const database = ctx.path.database;
    const kysDBPath = ctx.path.kys;
    console.log("[sqlite3] Connect DB path :", database);
    console.log("[sqlite3] Connect KYS-DB path :", kysDBPath);
    this.kysDB = new sqlite3.Database(
      kysDBPath,
      function (err: any) {
        if (err) {
          return;
        }
        console.log("Connect sqlite3-kysdb successed.")
      }
    )
    this.db = new sqlite3.Database(
      database,
      function (err: any) {
        if (err) {
          return;
        }
        console.log("Connect sqlite3-db successed.")
        DBConnectedCallback();
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]) {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (method == Index_Methods.load) {
      data = await this.load();
    }
    event.reply(Channel, [this.getSingal(), method, [data]])
  }

  private async load(): Promise<any> {
    const encrypt = await this.loadWalletKeystoreFromDB();
    const rpc_configs = await this.loadRpcConfig();
    const wallet_names = await this.loadWalletNames();
    const app_props = await this.loadAppProps();
    return {
      path: this.ctx.path,
      encrypt,
      rpc_configs,
      wallet_names,
      app_props,
      os : {
        locale : this.ctx.osLocale ,
        platform : this.ctx.os
      }
    }
  }

  private loadWalletNames(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM wallet_names",
        [],
        (err: any, rows: any) => {
          if (err) {
            reject(err)
            return;
          }
          resolve(rows);
        }
      )
    });
  }

  private loadAppProps():Promise<any>{
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM app_props",
        [],
        (err: any, rows: any) => {
          if (err) {
            reject(err)
            return;
          }
          resolve(rows);
        }
      )
    });
  }


  private loadRpcConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM Rpc_Config",
        [],
        (err: any, rows: any) => {
          if (err) {
            reject(err)
            return;
          }
          resolve(rows);
        }
      )
    });
  }

  private async loadWalletKeystoreFromDB() {
    const queryPromise = new Promise<any>((resolve, reject) => {
      this.kysDB.all("SELECT * from wallet_kys limit 1", [],
        (err: any, rows: any) => {
          resolve(rows);
        })
    });
    const rows = await queryPromise;
    if (rows.length > 0) {
      const base58Encode = rows[0].data;
      const encrypt = JSON.parse(
        ethers.utils.toUtf8String(
          ethers.utils.base58.decode(base58Encode)
        )
      );
      return encrypt;
    }
    return undefined;
  }

}
