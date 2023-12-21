import { IpcRendererEvent } from "electron";
import { IpcRenderer } from "electron/renderer";

export type Channels_Application = 'ipc-application';

export class ApplicationIpcManager {

  constructor() {

  }

  // preload.ts 中注册通道.
  public registerChannel(ipcRenderer: IpcRenderer): {

  } {
    return {
      sendMessage(channel: Channels_Application, ...args: unknown[]) {
        ipcRenderer.send(channel, ...args);
      },
      on(channel: Channels_Application, func: (...args: unknown[]) => void) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
          func(...args);
        ipcRenderer.on(channel, subscription);

        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      },
      once(channel: Channels_Application, func: (...args: unknown[]) => void) {
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      },
    }
  }

  // main.ts 中激活通道监听.
  public activeChannelListen(ipcMain: Electron.IpcMain): void {

  }

}

export default new ApplicationIpcManager();
