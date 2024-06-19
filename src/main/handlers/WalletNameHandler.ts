import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const WalletNameSignal = "DB:sqlite3/walletNames";

export enum WalletName_Methods {
  saveOrUpdate = "saveOrUpdate",
  getAll = "getAll"
}

export class WalletNameHandler implements ListenSignalHandler {

  private ctx: Context;

  private db: any;

  getSingal(): string {
    return WalletNameSignal;
  }

  constructor(ctx: any, db: any) {
    this.ctx = ctx;
    this.db = db;

    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"wallet_names\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"address\" text,"
      + " \"name\" text,"
      + " \"active\" INTEGER"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table wallet_names Error:", err);
          return;
        }
        console.log("[sqlite3] Check wallet_names Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (WalletName_Methods.saveOrUpdate == method) {
      const rpcConfig = params[0];
      data = this.saveOrUpdate(rpcConfig);
    } else if (WalletName_Methods.getAll == method) {
      this.getAll((rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    }
  }

  private getAll(callback: (rows: any) => void) {
    this.db.all("SELECT * FROM wallet_names", [],
      (err: any, rows: any) => {
        callback(rows);
      })
  }

  private saveOrUpdate(walletName: { address: string, name: string, active: number }) {
    const { address, name, active } = walletName;
    if (active == 1) {
      this.db.run("update wallet_names set active = 0", [], (error: any) => {

      })
    }
    this.db.all(
      "SELECT * FROM wallet_names WHERE address = ?",
      [address],
      (err: any, rows: any) => {
        if (err) {
          return;
        }
        if (rows.length == 0) {
          console.log("save wallet-name =", name)
          // do save
          this.db.run(
            "INSERT INTO wallet_names(address,name,active) VALUES(?,?,?)",
            [address, name, active],
            (err: any) => {
              if (err) {
                console.log("save error:", err)
              }
            }
          )
        } else {
          // do update
          console.log("update wallet-name:", JSON.stringify(walletName));
          this.db.run(
            "UPDATE wallet_names Set name = ? , active = ? WHERE address = ?",
            [name, active, address],
            (err: any) => {
              if (err) {
                console.log("update error!!!")
              }
            }
          )
        }
      }
    )
  }

}
