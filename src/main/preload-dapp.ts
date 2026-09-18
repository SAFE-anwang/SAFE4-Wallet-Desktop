import { contextBridge, ipcRenderer } from "electron";
console.log("====== preload-dapp.ts prepare loading ======");

// 开发模式开关
//  true  → 所有未处理的方法都交给 Render（方便调试）
//  false → 只有 DApp_Support_INTERACTIVE_Methods 中的方法交给 Render，其余抛 4200
const DEV = true;

export const DApp_Support_READONLY_Methods = new Set([
  // 链信息（web3_clientVersion 走 RPC）
  "web3_clientVersion",
  // 区块 / 账户
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getStorageAt",
  // 只读调用
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
  // 交易 / 日志查询
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getLogs",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
]);

export const DApp_Support_INTERACTIVE_Methods = new Set([
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
  "eth_sendTransaction",
  "personal_sign",
  // "eth_signTypedData_v4",
  // "eth_sign",
]);

export const DApp_Unsupport_Methods = new Set([
  "wallet_watchAsset",
  "wallet_getCapabilities",
]);

// ==============================
// 错误类型（EIP-1193）
// ==============================
class ProviderRpcError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// ==============================
// 类型定义
// ==============================
export interface WalletState {
  accounts: string[];
  chainId: string;
  rpc: string | null;
  isConnecting: boolean;
  isInitialized: boolean;
}

class DAppWalletState {
  private state: WalletState = {
    accounts: [],
    chainId: "0x1",
    rpc: null,
    isConnecting: false,
    isInitialized: false,
  };
  private initializePromise: Promise<WalletState> | null = null;
  private grantedAt: number = 0;

  constructor() { }

  // ==============================
  // 状态获取方法
  // ==============================
  getState(): WalletState {
    return {
      ...this.state,
      accounts: [...this.state.accounts],
    };
  }

  getAccounts(): string[] {
    return [...this.state.accounts];
  }

  getChainId(): string {
    return this.state.chainId;
  }

  getRpc(): string | null {
    return this.state.rpc;
  }

  // -------- 派生属性 --------
  getSelectedAddress(): string | null {
    return this.state.accounts[0] ?? null;
  }

  getNetworkVersion(): string {
    return String(parseInt(this.state.chainId, 16));
  }

  getGrantedAt(): number {
    return this.grantedAt;
  }

  isWalletConnected(): boolean {
    return this.state.accounts.length > 0;
  }

  isWalletConnecting(): boolean {
    return this.state.isConnecting;
  }

  isWalletInitialized(): boolean {
    return this.state.isInitialized;
  }

  // ==============================
  // 状态更新方法
  // ==============================
  grant(accounts: string[]) {
    this.state.accounts = [...accounts];
    this.grantedAt = Date.now();
    console.log("[preload-dapp.ts] 授权账户:", accounts);
  }

  revoke() {
    this.state.accounts = [];
    this.grantedAt = 0;
    ipcRenderer.send("dapp-wallet-sync", {
      origin,
      dAppWalletState: dAppWalletState.getState(),
    });
    console.log("[preload-dapp.ts] 已撤销授权");
  }

  setChain(chainId: string, rpc: string | null) {
    this.state.chainId = chainId;
    this.state.rpc = rpc;
    console.log("[preload-dapp.ts] 链已更新:", chainId, "RPC:", rpc);
  }

  setConnecting(isConnecting: boolean) {
    this.state.isConnecting = isConnecting;
    console.log("[preload-dapp.ts] 连接状态已更新:", isConnecting);
  }

  setInitialized(isInitialized: boolean) {
    this.state.isInitialized = isInitialized;
  }

  reset() {
    this.state = {
      accounts: [],
      chainId: "0x1",
      rpc: null,
      isConnecting: false,
      isInitialized: false,
    };
    this.initializePromise = null;
    this.grantedAt = 0;
    console.log("[preload-dapp.ts] 钱包状态已重置");
  }

  // ==============================
  // 初始化：只拿 chainId / rpc，不拿账户
  // ==============================
  async initialize(): Promise<WalletState> {
    if (this.state.isInitialized) {
      return this.getState();
    }
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      try {
        const result = await ipcRenderer.invoke("dapp-wallet-initialize", {
          origin: window.location.origin,
        });

        let chainId = "0x1";
        let rpc: string | null = null;

        if (result && result.data) {
          const { data } = result;
          if (data.chainId !== undefined) {
            if (typeof data.chainId === "number") {
              chainId = "0x" + data.chainId.toString(16);
            } else if (typeof data.chainId === "string") {
              chainId = data.chainId.startsWith("0x")
                ? data.chainId
                : "0x" + parseInt(data.chainId, 10).toString(16);
            }
          }
          rpc = data.rpc ?? null;
        }

        this.state.chainId = chainId;
        this.state.rpc = rpc;
        this.state.accounts = [];
        this.state.isInitialized = true;

        console.log("[preload-dapp.ts] 初始化完成:", this.state);
        return this.getState();
      } catch (error) {
        console.error("[preload-dapp.ts] 初始化失败:", error);
        this.state.isInitialized = true;
        return this.getState();
      } finally {
        setTimeout(() => {
          this.initializePromise = null;
        }, 0);
      }
    })();

    return this.initializePromise;
  }
}

// ==============================
// 创建实例
// ==============================
const dAppWalletState = new DAppWalletState();

// ==============================
// EIP-1193 Provider
// ==============================
const listeners: Record<string, Function[]> = {};
const providerUUID = "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d";

const ethereum: any = {
  isMetaMask: true,
  isSafe4Wallet: true,

  get chainId() {
    return dAppWalletState.getChainId();
  },

  get networkVersion() {
    return dAppWalletState.getNetworkVersion();
  },

  get selectedAddress() {
    return dAppWalletState.getSelectedAddress();
  },

  isConnected: () => dAppWalletState.isWalletConnected(),

  request: async (dAppRequestParams: { method: string; params: any }) => {
    const origin = window.location.origin;
    const { method, params } = dAppRequestParams;
    console.log("[ethereum.request] dApp请求:", method, params);

    // 同步状态给主进程
    ipcRenderer.send("dapp-wallet-sync", {
      origin,
      dAppWalletState: dAppWalletState.getState(),
    });

    // ============================================
    // 路径 1：本地钱包状态直接返回
    // ============================================
    switch (method) {
      case "eth_chainId": {
        const chainId = dAppWalletState.getChainId();
        console.log("[ethereum.request]:eth_chainId return =>", chainId);
        return chainId;
      }
      case "net_version": {
        const netVersion = dAppWalletState.getNetworkVersion();
        console.log("[ethereum.request]:net_version return =>", netVersion);
        return netVersion;
      }
      case "eth_accounts": {
        const accounts = dAppWalletState.isWalletConnected()
          ? dAppWalletState.getAccounts()
          : [];
        console.log("[ethereum.request]:eth_accounts return =>", accounts);
        return accounts;
      }
      case "wallet_requestPermissions": {
        const requested = params?.[0] ?? {};
        const selectedAddress = dAppWalletState.getSelectedAddress();
        const permissions: any[] = [];
        if (requested.eth_accounts) {
          permissions.push({
            parentCapability: "eth_accounts",
            caveats: [{
              type: "restrictReturnedAccounts",
              value: selectedAddress ? [selectedAddress] : [],
            }],
            invoker: origin,
            date: dAppWalletState.getGrantedAt() || Date.now(),
          });
        }
        console.log("[ethereum.request] wallet_requestPermissions return =>", permissions);
        return permissions;
      }
      case "wallet_getPermissions": {
        if (!dAppWalletState.isWalletConnected()) {
          return [];
        }
        const selectedAddress = dAppWalletState.getSelectedAddress();
        return [{
          parentCapability: "eth_accounts",
          caveats: [{
            type: "restrictReturnedAccounts",
            value: selectedAddress ? [selectedAddress] : [],
          }],
          invoker: origin,
          date: dAppWalletState.getGrantedAt() || Date.now(),
        }];
      }
      case "wallet_revokePermissions": {
        dAppWalletState.revoke();
        ethereum.emit("accountsChanged", []);
        console.log("[ethereum.request] wallet_revokePermissions return => null");
        return null;
      }
      case "eth_requestAccounts": {
        // 已授权，直接返回
        if (dAppWalletState.isWalletConnected()) {
          return dAppWalletState.getAccounts();
        }
        // 正在请求中，轮询等待
        if (dAppWalletState.isWalletConnecting()) {
          return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (!dAppWalletState.isWalletConnecting()) {
                clearInterval(checkInterval);
                resolve(dAppWalletState.getAccounts());
              }
            }, 100);
          });
        }
        // 走 IPC 请求用户授权
        dAppWalletState.setConnecting(true);
        try {
          const result = await ipcRenderer.invoke("dapp-request", [{
            origin,
            dAppRequestParams,
            dAppWalletState: dAppWalletState.getState(),
          }]);
          console.log("[ethereum.request]:eth_requestAccounts IPC-Response <= ", result);

          if (result.approved && Array.isArray(result.data) && result.data.length > 0) {
            const accounts = result.data;
            dAppWalletState.grant(accounts);
            ethereum.emit("accountsChanged", accounts);
            ethereum.emit("connect", { chainId: dAppWalletState.getChainId() });
            console.log("[ethereum.request]:eth_requestAccounts return => ", accounts);
            return accounts;
          }

          throw new ProviderRpcError(4001, "User rejected the request.");
        } catch (error) {
          console.error("[ethereum.request]:eth_requestAccounts 授权失败:", error);
          throw error;
        } finally {
          dAppWalletState.setConnecting(false);
        }
      }
    }

    // ============================================
    // 路径 2：只读方法 → preload 直接 fetch RPC
    // ============================================
    if (DApp_Support_READONLY_Methods.has(method)) {
      const rpcUrl = dAppWalletState.getRpc();
      if (!rpcUrl) {
        const chainId = dAppWalletState.getChainId();
        const err = new ProviderRpcError(
          4901,
          `No RPC configured for chainId ${chainId}.`
        );
        console.error(`[ethereum.request]:${method} no rpc =>`, err);
        throw err;
      }
      try {
        const resp = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method,
            params: params ?? [],
          }),
        });
        console.log(`[ethereum.request]:${method} Fetch From ${rpcUrl} Response <=`, resp);

        if (!resp.ok) {
          throw new ProviderRpcError(-32603, `RPC HTTP error ${resp.status}`);
        }
        let json: any;
        try {
          json = await resp.json();
        } catch {
          throw new ProviderRpcError(-32603, "Invalid JSON response from RPC");
        }
        if (json.error) {
          throw new ProviderRpcError(
            json.error.code ?? -32603,
            json.error.message ?? "RPC error",
            json.error.data
          );
        }
        console.log(`[ethereum.request]:${method} return =>`, json.result);
        return json.result;
      } catch (error) {
        console.error(`[ethereum.request]:${method} throw error =>`, error);
        throw error;
      }
    }

    if (DApp_Unsupport_Methods.has(method)) {
      const err = new ProviderRpcError(
        4200,
        `The method "${method}" is not supported.`
      );
      console.warn(`[ethereum.request]:${method} unsupported =>`, err);
      throw err;
    }

    // ============================================
    // 路径 3：其余 → 交给 Render 处理
    // ============================================
    // DEV = false 时，只有明确支持的方法才交给 Render，其余抛 4200
    if (!DEV && !DApp_Support_INTERACTIVE_Methods.has(method)) {
      const err = new ProviderRpcError(
        4200,
        `The method "${method}" is not supported.`
      );
      console.warn(`[ethereum.request]:${method} unsupported =>`, err);
      throw err;
    }

    const result = await ipcRenderer.invoke("dapp-request", [{
      origin,
      dAppRequestParams,
      dAppWalletState: dAppWalletState.getState(),
    }]);
    console.log(`[ethereum.request]:${method} IPC-Response <=`, result);

    const { approved, data, error } = result;

    if (!approved) {
      let err: any;
      if (error && error.code && error.message) {
        err = new ProviderRpcError(error.code, error.message);
      } else {
        err = new ProviderRpcError(4001, "用户拒绝了该请求");
      }
      console.warn(`[ethereum.request]:${method} throw =>`, err);
      throw err;
    }

    if (method === "wallet_switchEthereumChain") {
      const { chainId, rpc } = data;
      dAppWalletState.setChain(chainId, rpc);
      ethereum.emit("chainChanged", chainId);
      console.log(`[ethereum.request]:${method} return => null, newChainId=${chainId} RPC=${rpc}`);
      return null;
    }

    if (method === "wallet_addEthereumChain") {
      const { chainId, rpc } = data;
      dAppWalletState.setChain(chainId, rpc);
      ethereum.emit("chainChanged", result.chainId);
      console.log(`[ethereum.request]:${method} return => null, newChainId=${chainId} RPC=${rpc}`);
      return null;
    }

    console.log(`[ethereum.request]:${method} return => `, data);
    return data;
  },

  enable: async () => {
    return ethereum.request({ method: "eth_requestAccounts" });
  },

  on(event: string, callback: Function) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
    return ethereum;
  },

  removeListener(event: string, callback: Function) {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(fn => fn !== callback);
    }
    return ethereum;
  },

  emit(event: string, data: any) {
    if (listeners[event]) {
      listeners[event].forEach(fn => {
        try {
          fn(data);
        } catch (error) {
          console.error("事件监听器错误:", error);
        }
      });
    }
    return ethereum;
  },
};

// ==============================
// 监听主进程的状态变更
// ==============================
ipcRenderer.on("dapp-wallet-change", (event, payload) => {
  console.log("[preload-dapp.ts] 主进程通知钱包变更:", payload);
  const params = payload[0];
  const { method } = params;

  switch (method) {
    case "accountsChanged": {
      if (!dAppWalletState.isWalletConnected()) {
        return;
      }
      dAppWalletState.revoke();
      ethereum.emit("accountsChanged", []);
      ethereum.emit("disconnect", { code: 4900, message: "Wallet account changed" });
      break;
    }
    case "chainChanged": {
      if (!dAppWalletState.isWalletConnected()) {
        return;
      }
      dAppWalletState.setChain(params.chainId, params.rpc ?? null);
      ethereum.emit("chainChanged", params.chainId);
      break;
    }
    default:
      break;
  }
});

// ==============================
// 设置和初始化
// ==============================
async function setupWallet() {
  console.log("[preload-dapp.ts:Setup] 开始设置钱包...");
  await dAppWalletState.initialize();
  console.log("[preload-dapp.ts:Setup] 钱包初始化完成，通知主进程");
  ipcRenderer.send("dapp-preload-loaded");
}

// 暴露到页面
const providerInfo = Object.freeze({
  uuid: providerUUID,
  name: "Safe4 Desktop Wallet",
  icon: "data:image/png;base64,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",
  rdns: "com.anwang.safe4.desktop.wallet",
});
contextBridge.exposeInMainWorld("ethereum", ethereum);
contextBridge.exposeInMainWorld("safe4DesktopWallet", providerInfo);
// 暴露调试接口
contextBridge.exposeInMainWorld("safe4WalletDebug", {
  getState: () => dAppWalletState.getState(),
  resetState: () => dAppWalletState.reset()
});
// 立即开始设置
setupWallet();
console.log("====== preload-dapp.ts loaded ======");
