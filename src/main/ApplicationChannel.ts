
import { ListenSignalHandler } from "./handlers/ListenSignalHandler";

export class ApplicationChannel {

  ipcMain : Electron.IpcMain;
  listenSignalHandlers: ListenSignalHandler[] = [];

  constructor( ipcMain : Electron.IpcMain ){
    this.ipcMain = ipcMain;
  }

  public registerEvents() : void {
    console.log("do registerEvents ..> ??")
    this.registerKeyStoreEvent();
  }

  private registerKeyStoreEvent() : void {
    // this.ipcMain.on('event:load_key_store', async (event, arg) => {
    //   event.reply('event:load_key_store', "I m the keystore ...");
    // });
  }

}

export function hello(){
  console.log("hello")
}


