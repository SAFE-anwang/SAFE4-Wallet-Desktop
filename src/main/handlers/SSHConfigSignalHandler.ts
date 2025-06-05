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

  private algorithm: any;
  private secret: any;
  private iv: any;

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

        //////////////////////
        this.algorithm = 'aes-256-cbc';
        this.secret = 'Safe4WaLLetDesktop_DefaultAESecret';
        this.iv = Buffer.alloc(16, 0);
        ///////////////////////
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
      event.reply(Channel, [this.getSingal(), method, [data]]);
    }
  }

  private saveOrUpdate(sshConfig: any[]) {

    sshConfig.forEach(sshConfig => {
      const { host, port, username, password } = sshConfig;
      const _password = this.encrypt(host, password);
      this.db.all("select * from ssh_config where host = ?", [host], (err: any, rows: any) => {
        if (err) {
          console.log("[sqlite3/ssh_config] saveOrUpdate-query Error:", err);
          return;
        }
        if (rows.length == 0) {
          this.db.run("insert into ssh_config(host , port , username , password) values( ? , ?  , ? , ?)",
            [host, port, username, _password],
            (err: any, rows: any) => {
              if (err) {
                console.log("[sqlite3/ssh_config] saveOrUpdate-save Error:", err);
                return;
              }
              console.log("[sqlite3/ssh_config] saveOrUpdate-save success for", host);
            })
        } else {
          this.db.run("update ssh_config set username = ? , port = ? , password = ? where host = ?",
            [username, port, _password, host],
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
          if (rows.length > 0) {
            for (let i = 0; i < rows.length; i++) {
              rows[i].password = this.decrypt(rows[i].host, rows[i].password);
            }
          }
          resolve(rows);
        }
      )
    });
  }

  private encrypt(host: string, password: string): string {
    const crypto = require("crypto");
    const key = crypto.createHash('sha256').update( host + this.secret).digest();
    const cipher = crypto.createCipheriv(this.algorithm, key, this.iv);
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
  }

  private decrypt(host: string, encryptedBase64: string): string {
    const crypto = require("crypto");
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const key = crypto.createHash('sha256').update( host + this.secret).digest();
    const decipher = crypto.createDecipheriv(this.algorithm, key, this.iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }


}
