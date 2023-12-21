


export class ApplicationChannel {

  ipcMain : Electron.IpcMain;

  constructor( ipcMain : Electron.IpcMain ){
    this.ipcMain = ipcMain;
  }

  public registerEvents() : void {
    this.registerKeyStoreEvent();
  }

  private registerKeyStoreEvent() : void {
    this.ipcMain.on('event:load_key_store', async (event, arg) => {
      event.reply('event:load_key_store', "I m the keystore ...");
    });
  }

}


