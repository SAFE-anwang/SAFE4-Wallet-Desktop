
const ssh2 = require("ssh2");

export class SSH2Ipc {

  sshConnection: any;

  constructor(ipcMain: any) {

    ipcMain.handle('connect-ssh', async (_: any, { host, username, password }: { host: string, port: number, username: string, password: string }) => {
      return new Promise((resolve, reject) => {
        const conn = new ssh2.Client();
        console.log(`[ssh2] Connect to ${host} / ${username}`)
        conn.on('ready', () => {
          this.sshConnection = conn;
          resolve(true);
          console.log(`Connect ${host} success!`)
        }).on('error', (err: any) => {
          reject(err);
        }).connect({ host, username, password });
      });
    });

    ipcMain.handle('exec-command', async (event: any, { command }: { command: string }) => {
      if (!this.sshConnection) {
        throw new Error(`Connection not found`);
      }
      return new Promise((resolve, reject) => {
        console.log(`[ssh2] +++++++ {'${command}'} +++++++`);
        this.sshConnection.exec(command, (err: any, stream: any) => {
          if (err) {
            reject(err);
          } else {
            let data = '';
            let stderrBuffer = '';
            stream.on('data', (chunk: any) => {
              data += chunk;
            }).on('close', () => {
              console.log(`${data}`);
              console.log(`[ssh2] ------- {'${command}'} -------`);
              resolve(data);
            }).stderr.on('data', (chunk: any) => {
              let chunkStr = chunk.toString();
              let newlineIndex = chunkStr.indexOf('\n');
              if (newlineIndex != -1) {
                stderrBuffer += chunkStr.substring(0, newlineIndex + 1);
                event.sender.send('ssh2-stderr', [stderrBuffer]);
                console.log("[ssh2-stderr]:", stderrBuffer);
                stderrBuffer = '';
                stderrBuffer = chunkStr.substring(newlineIndex + 1);
              } else {
                stderrBuffer += chunk;
              }
            });
          }
        });
      });
    });

    ipcMain.handle('shell-command', async (event: any, { command }: { command: string }) => {
      if (!this.sshConnection) {
        throw new Error(`SSH connection not found`);
      }

      return new Promise((resolve, reject) => {
        console.log(`[ssh2-shell->>[${command}]`);
        // 使用 shell 方法执行命令
        this.sshConnection.shell((err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          let data = '';
          let stderrBuffer = '';
          // 监听数据流
          stream.on('data', (chunk: any) => {
            if (chunk.toString().trim() === command) {

            } else {
              console.log(`[ssh2-shell-<<]${chunk}`);
              event.sender.send('ssh2-stderr', [chunk.toString()]);
            }
          });
          // 监听错误流
          stream.stderr.on('data', (chunk: any) => {
            console.log(`[ssh2] Received error: ${chunk}`);
            let chunkStr = chunk.toString();
            let newlineIndex = chunkStr.indexOf('\n');
            if (newlineIndex !== -1) {
              stderrBuffer += chunkStr.substring(0, newlineIndex + 1);
              event.sender.send('ssh2-stderr', [stderrBuffer]);
              console.log("[ssh2-stderr]:", stderrBuffer);
              stderrBuffer = chunkStr.substring(newlineIndex + 1);
            } else {
              stderrBuffer += chunkStr;
            }
          });
          // 监听流关闭事件
          stream.on('close', () => {
            console.log(`[ssh2] Command execution completed`);
            resolve(data);
          });
          // 发送命令并结束会话
          stream.write(command + '\n');
        });
      });
    });

  }



}
