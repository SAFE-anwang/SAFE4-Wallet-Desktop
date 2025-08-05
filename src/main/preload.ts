import { Provider } from 'react-redux';
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, OpenExternalOptions } from 'electron';
import { ethers, TypedDataDomain } from 'ethers';
import { TransactionRequest, Web3Provider } from '@ethersproject/providers';
import { EtherStructuredError } from './WalletIpc';
import { Wallet } from '../renderer/state/wallets/reducer';
import { SupportChildWalletType } from './WalletNodeGenerator';

export type Channels = 'ipc-example';

const electronHandler = {
  shell: {
    openExternal(url: string, options?: OpenExternalOptions) {
      // shell.openExternal(url, options)
    },
    openPath(path: string) {
      return ipcRenderer.invoke("shell-openPath", path)
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
    close() {
      return ipcRenderer.invoke('connect-close', {})
    }
  },

  sshs: {
    connect(host: string, port: number, username: string, password: string) {
      return ipcRenderer.invoke('sshs-connect-ssh', { host, username, password });
    },
    execute(host: string, command: string) {
      return ipcRenderer.invoke('sshs-exec-command', { host, command })
    },
    shell(command: string) {
      return ipcRenderer.invoke('sshs-shell-command', { command })
    },
    on(func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on("sshs-ssh2-stderr", subscription);

      return () => {
        ipcRenderer.removeListener("sshs-ssh2-stderr", subscription);
      };
    },
    close(host: string) {
      console.log("sshs close connect :", host)
      return ipcRenderer.invoke('sshs-connect-close', { host })
    }
  },

  fileReader: {
    readFile(filePath: string) {
      return ipcRenderer.invoke("file-read", { filePath });
    },
    selectFile() {
      return ipcRenderer.invoke("file-select");
    }
  },

  crypto: {
    decrypt(params: any) {
      return ipcRenderer.invoke("crypto-scrypt-decrypt", params)
    }
  },

  wallet: {

    decrypt(password: string): Promise<Wallet[]> {
      return ipcRenderer.invoke("wallet-decrypt", [password]);
    },

    importWallet({
      mnemonic, password, path, privateKey
    }: {
      mnemonic?: string,
      password?: string,
      path?: string,
      privateKey?: string
    }, initWalletPassword?: string): Promise<{
      address: string, publicKey: string, path?: string
    } | undefined> {
      return ipcRenderer.invoke("wallet-importWallet", [{ mnemonic, password, path, privateKey }, initWalletPassword]);
    },

    signTransaction(activeAccount: string, tx: TransactionRequest): Promise<{ signedTx?: string, error?: EtherStructuredError }> {
      return ipcRenderer.invoke("wallet-signTransaction", [activeAccount, tx]);
    },
    viewMnemonic(walletAddress: string, password: string): Promise<[string, string | undefined, string] | undefined> {
      return ipcRenderer.invoke("wallet-viewMnemonic", [walletAddress, password]);
    },
    viewPrivateKey(walletAddress: string, password: string): Promise<string | undefined> {
      return ipcRenderer.invoke("wallet-viewPrivateKey", [walletAddress, password]);
    },
    viewKeystore(walletAddress: string, password: string): Promise<string | undefined> {
      return ipcRenderer.invoke("wallet-viewKeystore", [walletAddress, password]);
    },
    updatePassword(oldPassword: string, newPassword: string): Promise<string | undefined> {
      return ipcRenderer.invoke("wallet-updatePassword", [oldPassword, newPassword]);
    },
    generateNodeChildWallets(activeAccount: string, supportChildWalletType: SupportChildWalletType, _startAddressIndex: number, size: number): Promise<{ address: string, path: string, privateKey: string }[]> {
      return ipcRenderer.invoke("wallet-generate-nodechildwallets", [activeAccount, supportChildWalletType, _startAddressIndex, size]);
    },
    clean(): Promise<any> {
      return ipcRenderer.invoke("wallet-clean", []);
    },
    signTypedData(activeAccount: string, domain: TypedDataDomain, types: any, message: any): Promise<string> {
      return ipcRenderer.invoke("wallet-sign-typedData", [activeAccount, domain, types, message]);
    },
    drivePkByPath(activeAccount: string, path: string): Promise<string | undefined> {
      return ipcRenderer.invoke("wallet-drive-pkbypath", [activeAccount, path]);
    }
  }


};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
