import { Channel } from "../ApplicationIpcManager";
import { Context } from "./Context";
import { ListenSignalHandler } from "./ListenSignalHandler";


export const SSHConfigSignal = "DB:sqlite3/sshConfig";

export enum SSHConfig_Methods {
  saveOrUpdate = "saveOrUpdate",
  getAll = "getAll",
}

export class SSHConfigSignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return SSHConfigSignal;
  }

  private db: any;
  private ctx: Context;

  constructor(ctx: Context, db: any) {
    this.ctx = ctx;
    this.db = db;
    this.db.run(
      "CREATE TABLE IF NOT EXISTS \"ssh_config\" ( "
      + "\"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,"
      + " \"host\" text,"
      + " \"port\" INTEGER,"
      + " \"username\" text,"
      + " \"password\" text"
      + ");",
      [],
      (err: any) => {
        if (err) {
          console.log("[sqlite3] Create Table ssh_config Error:", err);
          return;
        }
        console.log("[sqlite3] Check ssh_config Exisits.")
      }
    )
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (SSHConfig_Methods.saveOrUpdate == method) {
      const sshConfigs = params[0];
      data = this.saveOrUpdate(sshConfigs);
    } else if (SSHConfig_Methods.getAll) {
      const data = await this.getAll();
      console.log("query data =>", data)
      event.reply(Channel, [this.getSingal(), method, [data]]);
    }
  }

  private saveOrUpdate(sshConfig: any[]) {

    sshConfig.forEach(sshConfig => {
      const { host, port, username, password } = sshConfig;
      this.db.all("select * from ssh_config where host = ?", [host], (err: any, rows: any) => {
        if (err) {
          console.log("[sqlite3/ssh_config] saveOrUpdate-query Error:", err);
          return;
        }
        if (rows.length == 0) {
          this.db.run("insert into ssh_config(host , port , username , password) values( ? , ?  , ? , ?)",
            [host, port, username, password],
            (err: any, rows: any) => {
              if (err) {
                console.log("[sqlite3/ssh_config] saveOrUpdate-save Error:", err);
                return;
              }
              console.log("[sqlite3/ssh_config] saveOrUpdate-save success for", host);
            })
        } else {
          this.db.run("update ssh_config set username = ? , port = ? , password = ? where host = ?",
            [username, port, password, host],
            (err: any, rows: any) => {
              if (err) {
                console.log("[sqlite3/ssh_config] saveOrUpdate-update Error:", err);
                return;
              }
              console.log("[sqlite3/ssh_config] saveOrUpdate-update success for", host);
            })
        }
      })
    });

  }

  private getAll() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM ssh_config",
        [],
        (err: any, rows: any) => {
          if (err) {
            console.log("[sqlite3/ssh_config] getAll Error:", err)
            reject(err)
            return;
          }
          resolve(rows);
        }
      )
    });
  }


}