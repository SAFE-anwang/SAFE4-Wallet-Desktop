/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, safeStorage, BrowserView } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { ApplicationIpcManager } from './ApplicationIpcManager';
import { View_Error, View_Loading } from './ViewBrowserPrepare';
const os = require('os');
const fs = require("fs");
const ssh2 = require("ssh2");

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;


//  ipcMain.on('ipc-example', async (event, arg) => {
//    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
//    console.log(msgTemplate(arg));
//    event.reply('ipc-example', msgTemplate('pong'));
//  });
// + 基于通道注册信号处理器
const resourcePath = app.isPackaged
  ? path.join(process.resourcesPath, '')
  : path.join(__dirname, '../../');
const appIpcManager = new ApplicationIpcManager(
  resourcePath, app.isPackaged
).register(ipcMain, safeStorage);

ipcMain.handle("shell-openPath", (_, path) => {
  shell.openPath(path);
})

// let sshConnection : any;
// SSH2
// ipcMain.handle('connect-ssh', async ( _ , { host, username, password }) => {
//   return new Promise((resolve, reject) => {
//     const conn = new ssh2.Client();
//     console.log(`[ssh2] Connect to ${host} / ${username}`)
//     conn.on('ready', () => {
//       sshConnection = conn;
//       resolve(true);
//       console.log(`Connect ${host} success!` )
//     }).on('error', (err: any) => {
//       reject(err);
//     }).connect({ host, username, password });
//   });
// });

// ipcMain.handle('exec-command', async (_, { command }) => {
//   if (!sshConnection) {
//     throw new Error(`Connection not found`);
//   }
//   return new Promise((resolve, reject) => {
//     console.log("exec-command ::" , command);
//     sshConnection.exec(command, (err : any, stream : any) => {
//       if (err) {
//         reject(err);
//       } else {
//         let data = '';
//         stream.on('data', (chunk : any) => {
//           data += chunk;
//         }).on('close', () => {
//           resolve(data);
//         });
//       }
//     });
//   });
// });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');


  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1500,
    height: 800,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false
    },
  });
  mainWindow.setMinimumSize(1500, 800);
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  if (mainWindow) {
    new DappViewIpc(ipcMain, mainWindow);
    appIpcManager.registerDAppRequestIpc(ipcMain, mainWindow);
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
    appIpcManager.ctx.updateOSLocale(app.getLocale(), os.platform());
  })
  .catch(console.log);


// DappViewIpc -

export class DappViewIpc {

  ipcMain: any;
  mainWindow: BrowserWindow;
  dappView: BrowserView | null = null;
  Wallet_UI_Open_Drawer: boolean = false;
  loadingView: BrowserView | null = null;
  errorView: BrowserView | null = null;

  constructor(ipcMain: any, mainWindow: BrowserWindow) {
    this.ipcMain = ipcMain;
    this.mainWindow = mainWindow;

    ipcMain.handle("dapp-view-open", async (event: any, _params: any) => {
      const url = _params[0];
      this.openURL(url);
    });
    ipcMain.handle("dapp-view-close", async () => {
      this.close();
    });
    ipcMain.handle("dapp-view-setOpenDrawer", async (event: any, _params: any) => {
      const [openDrawer] = _params;
      this.Wallet_UI_Open_Drawer = openDrawer;
      this.resizeDappView();
    });
    ipcMain.handle("dapp-view-goback", async () => {
      if (this.dappView && this.dappView.webContents.canGoBack()) {
        this.dappView.webContents.goBack();
        return true;
      }
      return false;
    });
    ipcMain.handle("dapp-view-forward", async () => {
      if (this.dappView && this.dappView.webContents.canGoForward()) {
        this.dappView.webContents.goForward();
        return true;
      }
      return false;
    });
    ipcMain.handle("dapp-view-reload", async () => {
      if (this.dappView) {
        this.dappView.webContents.reload();
      }
    });

    ipcMain.on("dapp-preload-loaded", () => {
      console.log("[DappView.Ipc] Preload-dapp.js Loaded, EIP-6963 声明 ...");
      if (this.dappView) {
        setTimeout(() => {
          if (this.dappView) this.injectEIP6963(this.dappView);
        }, 500);
      }
    });

    ipcMain.on("dapp-wallet-change", (event: any, payload: any[]) => {
      console.log("[DappView.Ipc] Render-UI Wallet Change : ", payload);
      this.dappView?.webContents.send("dapp-wallet-change", payload);
    });
  }

  private calcDappBounds() {
    const DEVTOOLS_DOCK_WIDTH = 500;

    const [width, height] = this.mainWindow.getContentSize();
    const menuWidth = 240;
    const drawerWidth = this.Wallet_UI_Open_Drawer ? 500 : 0;
    const devtoolsWidth = app.isPackaged ? 0 : DEVTOOLS_DOCK_WIDTH;

    const w = Math.max(0, width - menuWidth - drawerWidth - devtoolsWidth);
    const h = Math.max(0, height - 60);

    return { x: menuWidth, y: 60, width: w, height: h };
  }

  private destroyView(view: BrowserView | null) {
    if (!view) return;
    try {
      this.mainWindow.removeBrowserView(view);
    } catch (e) { /* ignore */ }
    try {
      (view.webContents as any).destroy?.();
    } catch (e) { /* ignore */ }
  }

  private createLoadingView(bounds: Electron.Rectangle) {
    this.destroyView(this.loadingView);
    this.loadingView = new BrowserView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this.mainWindow.addBrowserView(this.loadingView);
    this.loadingView.setBounds(bounds);
    this.loadingView.webContents.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(View_Loading)}`
    );
  }

  private createErrorView(bounds: Electron.Rectangle, message: string, url: string) {
    this.destroyView(this.errorView);
    this.errorView = new BrowserView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this.mainWindow.addBrowserView(this.errorView);
    this.errorView.setBounds(bounds);
    const html = View_Error(message, url);
    this.errorView.webContents.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
  }

  private describeError(code: number, desc: string): string {
    switch (code) {
      case -105: return "无法解析域名，请检查网址是否正确";
      case -106: return "网络未连接，请检查网络设置";
      case -7:   return "连接超时，请稍后重试";
      case -200:
      case -201: return "网站证书无效，无法安全连接";
      case -6:   return "页面不存在";
      default:   return desc || "加载失败，请稍后重试";
    }
  }

  private async openURL(url: string) {
    // 1. 清理旧 view
    this.destroyView(this.dappView);
    this.dappView = null;
    this.destroyView(this.loadingView);
    this.loadingView = null;
    this.destroyView(this.errorView);
    this.errorView = null;

    const bounds = this.calcDappBounds();

    // 2. 创建 dappView（底层）
    this.dappView = new BrowserView({
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, "preload-dapp.js")
          : path.join(__dirname, "../../.erb/dll/preload-dapp.js"),
        webSecurity: true,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    this.mainWindow.addBrowserView(this.dappView);
    this.dappView.setBounds(bounds);

    if (!app.isPackaged) {
      this.dappView.webContents.openDevTools({ mode: "detach" });
    }

    // 3. 创建 loadingView（上层）
    this.createLoadingView(bounds);

    // 4. 事件绑定
    this.dappView.webContents.setWindowOpenHandler((details) => {
      if (details.url.startsWith("https://")) {
        this.dappView?.webContents.loadURL(details.url);
      }
      return { action: "deny" };
    });

    this.dappView.webContents.on("will-navigate", (event, targetUrl) => {
      if (!targetUrl.startsWith("https://")) {
        event.preventDefault();
      }
    });

    const removeLoading = () => {
      if (this.loadingView) {
        this.destroyView(this.loadingView);
        this.loadingView = null;
      }
    };

    this.dappView.webContents.on("did-finish-load", () => {
      removeLoading();
      setTimeout(() => {
        if (this.dappView) this.injectEIP6963(this.dappView);
      }, 500);
    });

    this.dappView.webContents.on("did-fail-load", (_e, errorCode, errorDescription, validatedURL) => {
      console.error("[DappView.Ipc] 加载失败:", errorCode, errorDescription, validatedURL);

      // 移除 loadingView
      removeLoading();

      // 显示 errorView（覆盖在 dappView 之上）
      const message = this.describeError(errorCode, errorDescription);
      this.createErrorView(bounds, message, validatedURL);
    });

    this.dappView.webContents.on("did-navigate", (_event, targetUrl) => {
      console.log("[DappView.Ipc] 导航到:", targetUrl);
      this.updateNavigationState();
    });

    this.dappView.webContents.on("did-navigate-in-page", (_event, targetUrl) => {
      console.log("[DappView.Ipc] 页面内导航:", targetUrl);
      this.updateNavigationState();
    });

    this.mainWindow.removeAllListeners("resize");
    this.mainWindow.on("resize", () => this.resizeDappView());

    // 5. 加载 dApp
    this.dappView.webContents.loadURL(url);
    console.log("[DappView.Ipc] Open URL => ", url);
  }

  private updateNavigationState() {
    if (!this.dappView) return;
    const navState = {
      canGoBack: this.dappView.webContents.canGoBack(),
      canGoForward: this.dappView.webContents.canGoForward(),
      url: this.dappView.webContents.getURL(),
    };
    console.log("[DappView.Ipc] 导航状态:", navState);
    this.mainWindow.webContents.send("dapp-view-navigation", navState);
  }

  private async close() {
    this.destroyView(this.dappView);
    this.dappView = null;
    this.destroyView(this.loadingView);
    this.loadingView = null;
    this.destroyView(this.errorView);
    this.errorView = null;
  }

  private resizeDappView() {
    if (!this.dappView) return;
    const bounds = this.calcDappBounds();
    this.dappView.setBounds(bounds);
    if (this.loadingView) this.loadingView.setBounds(bounds);
    if (this.errorView) this.errorView.setBounds(bounds);
  }

  private injectEIP6963(view: BrowserView) {
    const script = `
    (function() {
      if (window.__SAFE4_DESKTOP_WALLET_ANNOUNCED__) {
        return;
      }
      if (!window.safe4DesktopWallet || !window.ethereum) {
        console.log("未发现 Safe4-Desktop-Wallet 注入,即将重试...");
        setTimeout(arguments.callee, 100);
        return;
      }
      window.__SAFE4_DESKTOP_WALLET_ANNOUNCED__ = true;
      const detail = Object.freeze({
        info: Object.freeze(window.safe4DesktopWallet),
        provider: window.ethereum
      });
      console.log("声明 Safe4-Desktop-Wallet:EIP-6963");
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", { detail: detail })
      );
      let hasResponded = false;
      window.addEventListener("eip6963:requestProvider", () => {
        if (!hasResponded) {
          hasResponded = true;
          window.dispatchEvent(
            new CustomEvent("eip6963:announceProvider", { detail: detail })
          );
        }
      });
      window.addEventListener("load", () => {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("eip6963:announceProvider", { detail: detail })
          );
        }, 1000);
      });
    })();
  `;

    view.webContents.executeJavaScript(script).catch((err) => {
      console.error("Failed to inject EIP-6963:", err);
    });
  }
}




