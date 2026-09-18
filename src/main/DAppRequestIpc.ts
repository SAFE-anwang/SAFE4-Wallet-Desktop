import { BrowserWindow } from "electron";
import { WalletState } from "./preload-dapp";

export interface Wallet_InitalizeData {
  requestId: string,
  origin: string,
}

export interface DAppRequest {
  origin: string,
  dAppRequestParams: {
    method: string,
    params: any
  }
  requestId: string,
  dAppWalletState: WalletState
}

export class DAppRequestIpc {

  ipcMain: any;
  mainWindow: BrowserWindow;
  pendingRequests: Map<string, ({ }: { approved: boolean, data?: any, error?: { code: number, message: string } }) => void> = new Map();

  constructor(ipcMain: any, mainWindow: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.mainWindow = mainWindow;

    ipcMain.handle("dapp-wallet-initialize", async (event: any, _params: any) => {
      console.log("[DappReq.Ipc] 处理 Dapp-WalletState 钱包状态初始化...", _params);
      const { origin } = _params;
      return new Promise((resolve, reject) => {
        const requestId = "Dapp-Wallet-Initialize:" + Date.now().toString();
        this.pendingRequests.set(requestId, resolve);
        console.log("[DappReq.Ipc] 向钱包 UI 发送 dapp-wallet-initalize 信息:", {
          requestId,
          origin
        });
        this.mainWindow.webContents.send("dapp-wallet-initialize", {
          requestId,
          origin
        });
      });
    });
    ipcMain.on("dapp-wallet-sync", async (event: any, _params: any) => {
      const { origin, dAppWalletState } = _params;
      return new Promise((resolve, reject) => {
        const requestId = "Dapp-Wallet-Sync:" + Date.now().toString();
        this.pendingRequests.set(requestId, resolve);
        console.log("[DappReq.Ipc] 向钱包 UI 发送 dapp-wallet-sync 信息:", {
          requestId,
          origin,
          dAppWalletState
        });
        this.mainWindow.webContents.send("dapp-wallet-sync", {
          requestId,
          origin,
          dAppWalletState
        });
      });
    });

    ipcMain.handle("dapp-request", async (event: any, _params: [{
      origin: string,
      dAppRequestParams: {
        method: string,
        params: any
      },
      dAppWalletState: WalletState
    }]) => {
      const [params] = _params;
      const { origin, dAppRequestParams, dAppWalletState } = params;
      const { method } = dAppRequestParams;
      console.log("[DappReq.Ipc] Handle Dapp-Request :", origin, params.dAppRequestParams);
      return new Promise((resolve) => {
        const requestId = method + "#" + Date.now().toString();
        this.pendingRequests.set(requestId, resolve);
        const dappRequest: DAppRequest = {
          origin,
          requestId,
          dAppRequestParams,
          dAppWalletState
        }
        console.log("[DappReq.Ipc] 向钱包 UI 发送 dapp-request-handle:" + method + " 信息,打开请求页面:", dAppRequestParams);
        this.mainWindow.webContents.send("dapp-request-handle", dappRequest);
      });
    })

    ipcMain.on("dapp-request-response", (event: any, { requestId, approved, data, error }: any) => {
      const promiseResolver = this.pendingRequests.get(requestId);
      if (promiseResolver != null) {
        console.log("[DappReq.Ipc] On Request-Response : ", {
          requestId, approved, data, error
        })
        promiseResolver({
          approved, data, error
        });
      }
    })

  }

}
