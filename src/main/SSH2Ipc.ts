
const ssh2 = require("ssh2");

function convertSpecialCharsToLiteral(str: string) {
  const specialCharsMap: any = {
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\b': '\\b',
    '\f': '\\f',
    '\v': '\\v',
    '\\': '\\\\',
    '\"': '\\"',
    '\'': '\\\''
  };
  return str.split('').map(char => specialCharsMap[char] || char).join('');
}

export interface SSH2ConnectConfig {
  host: string,
  port: number,
  username: string,
  password: string
}

export class SSH2Ipc {

  sshConnection: any;

  commandWaitingLine: string = '';

  constructor(ipcMain: any) {

    ipcMain.handle('connect-ssh', async (event: any, { host, username, password }: { host: string, port: number, username: string, password: string }) => {
      return new Promise((resolve, reject) => {
        const conn = new ssh2.Client();
        console.log(`[ssh2] Connect to ${host} / ${username}`)
        conn.on('ready', () => {
          this.sshConnection = conn;
          console.log(`Connect ${host} success!`);
          let lineBuffer = '';
          let chunkBuffer = '';
          const command = "whoami";
          conn.shell((err: any, stream: any) => {
            if (err) {
              reject(err);
              return;
            }
            stream.on('data', (chunk: any) => {
              chunkBuffer += chunk;
              lineBuffer += chunk.toString();
              // Check for a newline character indicating the end of a line
              if (lineBuffer.includes('\n')) {
                const lines = lineBuffer.split('\n');
                lineBuffer = lines.pop() || '';
                // Process each line
                lines.forEach(line => {
                  // 判断出 'root@iZwz9add4h2zp7bp5htps9Z:~#' 这个特殊字段出来.
                  // 每个命令结束后的最末字符串就是这个值.
                  // 这个值将作为标识一段命令的结束用于分割出命令的结果字符.
                  if (line.indexOf(`${username}`) == 0
                    && line.indexOf(`# ${command}`) > 0 || line.indexOf(`$ ${command}`) > 0) {
                    this.commandWaitingLine = line.split(" ")[0].trim();
                  } else if (line.trim() != command && line.trim() != username
                    && line.trim() != "exit" && line.trim() != "logout") {
                    if (this.commandWaitingLine != '' && line.trim().indexOf(this.commandWaitingLine) == 0) {

                    }else{
                      event.sender.send('ssh2-stderr', [line + "\n"]);
                    }
                  }
                });
              }
            });
            stream.on("close", () => {
              event.sender.send('ssh2-stderr', [this.commandWaitingLine + " "]);
              resolve(chunkBuffer);
              console.log(`[ssh2-shell/${command}] close;`)
            });
            stream.write(command + '\n');
            stream.write("exit\n");
          });
        }).on('error', (err: any) => {
          console.log("[ssh2] connect error:", err);
          reject(err);
        }).connect({ host, username, password , readyTimeout:120000 });

      });
    });

    ipcMain.handle("connect-close", () => {
      console.log("[ssh2] handle connection close;")
      if (this.sshConnection) {
        this.sshConnection.end();
        console.log("[ssh2] connection closed;")
      }
      this.commandWaitingLine = '';
    });

    ipcMain.handle('exec-command', async (event: any, { command }: { command: string }) => {
      if (!this.sshConnection) {
        throw new Error(`Connection not found`);
      }
      return new Promise((resolve, reject) => {
        console.log(`[ssh2-exec-${command}] >>>`);
        this.sshConnection.exec(command, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          let lineBuffer = '';
          let chunkBuffer = '';
          // 监听数据流
          stream.on('data', (chunk: any) => {
            chunkBuffer += chunk;
            lineBuffer += chunk.toString();
            // Check for a newline character indicating the end of a line
            if (lineBuffer.includes('\n')) {
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop() || '';
              // Process each line
              lines.forEach(line => {
                console.log(`[ssh2-exec-${command}] <<< ${line}`);
                event.sender.send('ssh2-stderr', [line + "\r\n"]);
              });
            }
          })
            .on("close", () => {
              resolve(chunkBuffer);
              console.log(`[ssh2-exec-${command} |end ::]`);
              event.sender.send('ssh2-stderr', [this.commandWaitingLine.trim() + " "]);
            });
          stream.stderr.on("data", (chunk: any) => {
            chunkBuffer += chunk;
            lineBuffer += chunk.toString();
            // Check for a newline character indicating the end of a line
            if (lineBuffer.includes('\n')) {
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop() || '';
              // Process each line
              lines.forEach(line => {
                console.log(`[ssh2-exec-${command}] <<< ${line}`);
                event.sender.send('ssh2-stderr', [line + "\r\n"]);
              });
            }
          })
        });
      });
    });

    ipcMain.handle('shell-command', async (event: any, { command }: { command: string }) => {
      if (!this.sshConnection) {
        throw new Error(`SSH connection not found`);
      }

      return new Promise((resolve, reject) => {
        console.log(`[ssh2-shell-${command}] >>>`);
        // 使用 shell 方法执行命令
        this.sshConnection.shell((err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          let lineBuffer = '';
          let chunkBuffer = '';
          let filterFirst = false;
          // 监听数据流
          stream.on('data', (chunk: any) => {
            lineBuffer += chunk.toString();
            // Check for a newline character indicating the end of a line
            if (lineBuffer.includes('\n')) {
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop() || '';
              // Process each line
              lines.forEach(line => {
                if (line.trim() == command) {
                  console.log(`[ssh2-shell-${command}] cmd< ${line}`);
                } else if (line.trim().indexOf(this.commandWaitingLine) > -1) {
                  filterFirst = true;
                  console.log(`[ssh2-shell-${command}] rmd< ${line}`);
                  event.sender.send('ssh2-stderr', [line + "\n"]);
                } else {
                  console.log(`[ssh2-shell-${command}] <<< ${line}`);
                  chunkBuffer += line + "\n";
                  event.sender.send('ssh2-stderr', [line + "\n"]);
                }
              });
            } else {
              event.sender.send('ssh2-stderr', [chunk.toString()]);
              // 判断剩余的字符是否为 'root@iZwz9add4h2zp7bp5htps9Z:~#' , 如果是,则标志着命令执行结束.
              if (lineBuffer.trim() == this.commandWaitingLine.trim()) { // Adjust this condition based on your prompt
                if (!filterFirst) {
                  filterFirst = !filterFirst;
                  console.log(`[ssh2-shell-${command}|fil] <<${lineBuffer}`);
                } else {
                  console.log(`[ssh2-shell-${command}|end] ::${lineBuffer}`);
                  resolve(chunkBuffer);
                  event.sender.send('ssh2-stderr', [lineBuffer]);
                }
              }
            }
          });
          // 监听错误流
          // stream.stderr.on('data', (chunk: any) => {
          //   console.log(`[ssh2] Received error: ${chunk}`);
          //   let chunkStr = chunk.toString();
          //   let newlineIndex = chunkStr.indexOf('\n');
          //   if (newlineIndex !== -1) {
          //     stderrBuffer += chunkStr.substring(0, newlineIndex + 1);
          //     event.sender.send('ssh2-stderr', [stderrBuffer]);
          //     console.log("[ssh2-stderr]:", stderrBuffer);
          //     stderrBuffer = chunkStr.substring(newlineIndex + 1);
          //   } else {
          //     stderrBuffer += chunkStr;
          //   }
          // });
          // 监听流关闭事件
          // stream.on('close', () => {
          //   console.log(`[ssh2] Command execution completed`);
          //   resolve(data);
          // });
          // 发送命令并结束会话
          stream.write(command + '\n');
        });
      });
    });

  }



}
