import { Channel } from "../ApplicationIpcManager";
import { ListenSignalHandler } from "./ListenSignalHandler";
const ssh2 = require("ssh2");

export const SSH2Singal = "ssh2:";

export enum SSH2_Methods {
  initConnection = "initConnection",
}

export class SSH2SignalHandler implements ListenSignalHandler {

  getSingal(): string {
    return SSH2Singal;
  }

  conn: any;

  constructor() {
    console.log("ssh2:", ssh2.Client)
  }

  async handleOn(event: Electron.IpcMainEvent, ...args: any[]): Promise<any> {
    const method: string = args[0][1];
    const params: any[] = args[0][2];
    let data = undefined;
    if (SSH2_Methods.initConnection == method) {
      const sshConfig = params[0];
      data = this.initConnection(sshConfig , (data : any) => {
        event.reply(Channel, [this.getSingal(), method, [data]])
      });
    }
  }

  private initConnection(sshConfig: any , callback : (data : any) => void) {
    console.log("Init SSH Connections :", sshConfig);
    const { host, port, username, password } = sshConfig;
    this.conn = new ssh2.Client();
    this.conn
      .on('ready', () => {
        console.log('Client :: ready');
        this.conn.exec('ps -ef|grep java', (err: any, stream: any) => {
          if (err) throw err;
          stream.on('close', (code: any, signal: any) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            this.conn.end();
          }).on('data', (data: any) => {
            console.log('STDOUT: ' + data);
            callback(data.toString());
          }).stderr.on('data', (data: any) => {
            console.log('STDERR: ' + data);
          });
        });
      })
      .on('timeout', () => {
        console.error('Connection timeout');
        this.conn.end(); // 关闭连接
      })
      .on('error', (err : any) => {
        console.error('Connection error:' , err);
        this.conn.end(); // 关闭连接
      })
      .connect({
        host,
        port,
        username,
        password,
        readyTimeout: 20000 // 设置连接超时为20秒
      });
  }

}
