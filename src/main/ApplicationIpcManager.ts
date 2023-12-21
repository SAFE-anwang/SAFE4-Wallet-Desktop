import { ListenSignalHandler } from "./handlers/ListenSignalHandler";
import { TestSignalHandler } from "./handlers/TestSignalHandler";

export class ApplicationIpcManager {

  listenSignalHandlers: ListenSignalHandler[] = [];

  constructor() {
    this.listenSignalHandlers.push(new TestSignalHandler());
  }

  public register(ipcMain : Electron.IpcMain) {
    ipcMain.on('ipc-example', async (event, arg) => {
      if (arg instanceof Array) {
        const signal = arg[0];
        const handlers = this.listenSignalHandlers.filter((handler) => {
          if (signal == handler.getSingal()) {
            return handler;
          }
        })
        if (handlers) {
          const handler = handlers[0];
          handler.handleOn(
            event, arg
          )
        } 
      }
      else {
        const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
        console.log(msgTemplate(arg));
        event.reply('ipc-example', msgTemplate('pong'));
      }
    });
  }
}


export function test(){
  console.log("run test")
}