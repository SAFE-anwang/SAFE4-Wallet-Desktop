import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const ERC20TokensSignal = "DB:sqlite3/erc20Tokens";

export enum ERC20Tokens_Methods {
  saveOrUpdate = "saveOrUpdate",
  getAll = "getAll"
}

export class ERC20TokenSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return ERC20TokensSignal;
  }

  private ctx: Context;

  private db: any;

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"erc20_tokens\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"chain_id\" INTEGER,"
      + " \"address\" text,"
      + " \"name\" text,"
      + " \"symbol\" text,"
      + " \"decims\" INTEGER,"
      + " \"props\" text"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table erc20_tokens Error:", err);
          return;
        }
        console.log("[sqlite3] Check erc20_tokens Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (ERC20Tokens_Methods.getAll == method) {
      const chainId = params[0];
      this.getAll(chainId , (rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    } else if (ERC20Tokens_Methods.saveOrUpdate == method) {

    }
  }

  private getAll(chainId : number , callback: (rows: any) => void) {
    this.db.all("SELECT * FROM erc20_tokens where chain_id = ?", [chainId],
      (err: any, rows: any) => {
        callback(rows);
      })
  }

  private saveOrUpdate() {

  }

}
