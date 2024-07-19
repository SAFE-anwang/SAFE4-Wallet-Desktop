// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, OpenExternalOptions, shell } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  shell: {
    openExternal(url: string, options?: OpenExternalOptions) {
      shell.openExternal(url, options)
    }
  },
  ipcRenderer: {
    /**
     *
     * @param channel
     * @param args [ "{signal}" , params : any[] ]
     */
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },

  ssh2: {
    connect(host: string, port: number, username: string, password: string) {
      return ipcRenderer.invoke('connect-ssh', { host, username, password });
    },
    execute(command: string) {
      return ipcRenderer.invoke('exec-command', { command })
    },
    shell(command: string) {
      return ipcRenderer.invoke('shell-command', { command })
    },
    on(func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on("ssh2-stderr", subscription);

      return () => {
        ipcRenderer.removeListener("ssh2-stderr", subscription);
      };
    },
  }

};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
