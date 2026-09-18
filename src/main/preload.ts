import { Provider } from 'react-redux';
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, OpenExternalOptions } from 'electron';
import { ethers, TypedDataDomain } from 'ethers';
import { TransactionRequest, Web3Provider } from '@ethersproject/providers';
import { EtherStructuredError } from './WalletIpc';
import { Wallet } from '../renderer/state/wallets/reducer';
import { SupportChildWalletType } from './WalletNodeGenerator';
import { Channels } from './ApplicationIpcManager';
import { DAppRequest, Wallet_InitalizeData } from './DappRequestIpc';
import { WalletState } from './preload-dapp';

// export type Channels = 'ipc-example';

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
    sendMessage(channel: Channels | string, ...args: unknown[]) {
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
    connect(host: string, port: number, username: string, password: string, nodeAddress?: string) {
      return ipcRenderer.invoke('sshs-connect-ssh', { host, username, password, nodeAddress });
    },
    execute(host: string, command: string, lockIp?: boolean) {
      return ipcRenderer.invoke('sshs-exec-command', { host, command, lockIp })
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
    signMessage(activeAccount: string, message: string): Promise<string> {
      return ipcRenderer.invoke("wallet-sign-message", [activeAccount, message]);
    },
    drivePkByPath(activeAccount: string, path: string): Promise<string | boolean> {
      return ipcRenderer.invoke("wallet-drive-pkbypath", [activeAccount, path]);
    }
  },

  dapp: {
    openView(url: string) {
      return ipcRenderer.invoke("dapp-view-open", [url]);
    },
    closeView() {
      return ipcRenderer.invoke("dapp-view-close", []);
    },
    setOpenDrawer(open: boolean) {
      return ipcRenderer.invoke("dapp-view-setOpenDrawer", [open]);
    },
    goBack: () => ipcRenderer.invoke("dapp-view-goback"),
    goForward: () => ipcRenderer.invoke("dapp-view-forward"),
    reload: () => ipcRenderer.invoke("dapp-view-reload"),

    onNavigationState: (callback: (data: any) => void) => {
      const handler = (event: any, data: any) => {
        callback(data);
      };
      ipcRenderer.on("dapp-view-navigation", handler);
      return () => {
        ipcRenderer.removeAllListeners("dapp-view-navigation");
      };
    },
    // 钱包页面反馈Dapp请求
    response(requestId: string, approved: boolean, data?: any, error?: { code: number, message: string }) {
      ipcRenderer.send("dapp-request-response", {
        requestId,
        approved,
        data,
        error
      })
    },
    // Dapp页面钱包初始化
    onWalletStateInitialize: (fn: (data: Wallet_InitalizeData) => void): () => void => {
      ipcRenderer.on("dapp-wallet-initialize", (event, data) => {
        fn(data);
      });
      // 返回频道监听移除函数;
      return () => {
        ipcRenderer.removeAllListeners("dapp-wallet-initialize");
      }
    },
    // Dapp页面钱包状态同步
    onWalletStateSync: (fn: (data: { origin: string, dAppWalletState: WalletState }) => void): () => void => {
      ipcRenderer.on("dapp-wallet-sync", (event, data) => {
        fn(data);
      });
      // 返回频道监听移除函数;
      return () => {
        ipcRenderer.removeAllListeners("dapp-wallet-sync");
      }
    },
    // Dapp页面通过 ethereum 对象发送请求
    onDappRequest: (fn: (dappRequest: DAppRequest) => void) => {
      ipcRenderer.on("dapp-request-handle", (event, dappRequest) => {
        console.log("preload.ts.ipcRenderer.on(dapp-request-handle):", dappRequest)
        fn(dappRequest);
      });
      return () => {
        ipcRenderer.removeAllListeners("dapp-request-handle");
      }
    },
  }

};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
