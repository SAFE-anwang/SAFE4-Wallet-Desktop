import { DBAddressActivitySingalHandler } from "./handlers/DBAddressActivitySingalHandler";
import { IndexSingalHandler } from "./handlers/IndexSingalHandler";
import { ListenSignalHandler } from "./handlers/ListenSignalHandler";
import { WalletSignalHandler } from "./handlers/WalletSignalHandler";
import { Channels } from "./preload";
import { Context } from "./handlers/Context";
import { RpcConfigSingalHandler } from "./handlers/RpcConfigSignalHandler";
import { ContractCompileHandler } from "./handlers/ContractCompileHandler";
import { TimeNodeRewardHandler } from "./handlers/TimeNodeRewardHandler";
import { WalletNameHandler } from "./handlers/WalletNameHandler";
import { SSH2Ipc } from "./SSH2Ipc";
import { ERC20TokenSignalHandler } from "./handlers/ERC20TokenSignalHandler";
import { LocalFileReader } from "./handlers/LocalFileReaderIpc";
import { CryptoIpc } from "./CryptoIpc";

export const Channel : Channels = "ipc-example";

export class ApplicationIpcManager {

  listenSignalHandlers: ListenSignalHandler[] = [];

  ctx : Context;

  constructor( resoucePath : string , appIsPackaged : boolean ) {
    const ctx = new Context(resoucePath,appIsPackaged);
    this.ctx = ctx;
    const indexSignalHandler = new IndexSingalHandler( ctx , () => {
      this.listenSignalHandlers.push( new WalletSignalHandler(ctx , indexSignalHandler.getSqliteKys()) );
      this.listenSignalHandlers.push( new DBAddressActivitySingalHandler(indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push( new RpcConfigSingalHandler(indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push( new ContractCompileHandler(ctx ,indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push( new TimeNodeRewardHandler(ctx ,indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push( new WalletNameHandler(ctx ,indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push( new ERC20TokenSignalHandler( ctx, indexSignalHandler.getSqlite3DB()));
    });
    this.listenSignalHandlers.push(indexSignalHandler);
  }
  public register(ipcMain : Electron.IpcMain) {
    ipcMain.on(Channel, async (event, arg) => {
      if (arg instanceof Array) {
        const signal = arg[0];
        const handlers = this.listenSignalHandlers.filter((handler) => {
          if (signal == handler.getSingal()) {
            return handler;
          }
        })
        if (handlers && handlers.length > 0) {
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
    new SSH2Ipc(ipcMain);
    new LocalFileReader(ipcMain);
    new CryptoIpc(ipcMain);
  }

}
