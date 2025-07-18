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
import { AppPropSignalHandler } from "./handlers/AppPropSignalHandler";
import { CrosschainSignalHandler } from "./handlers/CrosschainSignalHandler";
import { SSHSIpc } from "./SSHSIpc";
import { SSHConfigSignalHandler } from "./handlers/SSHConfigSignalHandler";
import { WalletIpc } from "./WalletIpc";

export const Channel: Channels = "ipc-example";

export class ApplicationIpcManager {

  listenSignalHandlers: ListenSignalHandler[] = [];

  public ctx: Context;

  private indexSignalHandler: IndexSingalHandler;

  constructor(resoucePath: string, appIsPackaged: boolean) {
    const ctx = new Context(resoucePath, appIsPackaged);
    this.ctx = ctx;
    this.indexSignalHandler = new IndexSingalHandler(ctx, () => {
      this.listenSignalHandlers.push(new WalletSignalHandler(ctx, this.indexSignalHandler.getSqliteKys()));
      this.listenSignalHandlers.push(new DBAddressActivitySingalHandler(this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new RpcConfigSingalHandler(this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new ContractCompileHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new TimeNodeRewardHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new WalletNameHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new ERC20TokenSignalHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new AppPropSignalHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new CrosschainSignalHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
      this.listenSignalHandlers.push(new SSHConfigSignalHandler(ctx, this.indexSignalHandler.getSqlite3DB()));
    });
    this.listenSignalHandlers.push(this.indexSignalHandler);
  }

  public register(ipcMain: Electron.IpcMain): ApplicationIpcManager {
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
    new SSHSIpc(ipcMain);
    new LocalFileReader(ipcMain);
    const walletIpc = new WalletIpc(ipcMain , this.indexSignalHandler.getSqliteKys());
    new CryptoIpc(ipcMain, walletIpc);
    return this;
  }
}
