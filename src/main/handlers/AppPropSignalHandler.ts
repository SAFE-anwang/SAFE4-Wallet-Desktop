import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const AppPropSignal = "DB:sqlite3/appProps";

export enum AppProp_Methods {
  getAll = "getAll",
  saveOrUpdateAppProp = "saveOrUpdateAppProp"
}

export class AppPropSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return AppPropSignal;
  }

  private ctx: Context;

  private db: any;

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"app_props\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"name\" text,"
      + " \"val\" text"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table app_props Error:", err);
          return;
        }
        console.log("[sqlite3] Check app_props Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (AppProp_Methods.getAll == method) {
      this.getAll((rows: any) => {
        event.reply(Channel, [this.getSingal(), method, [rows]])
      })
    }
    if (AppProp_Methods.saveOrUpdateAppProp == method) {
      const [name, val] = params;
      this.saveOrUpdateAppProp(name, val)
    }
  }

  private getAll(callback: (rows: any) => void) {
    this.db.all("SELECT * FROM app_props", [],
      (err: any, rows: any) => {
        callback(rows);
      })
  }

  private saveOrUpdateAppProp(name: string, val: string) {
    this.db.all("SELECT * FROM app_props where name = ?", [name],
      (err: any, rows: any) => {
        if (!err) {
          if (rows.length == 0) {
            // save
            this.db.run("INSERT INTO app_props(name , val) VALUES(?,?)", [name, val],
              (err: any, rows: any) => {

              })
          } else {
            // update
            this.db.run("UPDATE app_props set val = ? where name = ?", [val, name],
              (err: any, rows: any) => {

              })
          }
        }
      })
  }

}
