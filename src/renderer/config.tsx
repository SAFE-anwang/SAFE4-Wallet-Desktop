import { ChainId, Token } from "@uniswap/sdk";
import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

// Safe4 测试网|主网 网络ID
export enum Safe4NetworkChainId {
  Testnet = 6666666,
  Mainnet = 6666665
}

// Safe4 SAFE 原生币跨链到 BSC 网络资产池地址
export const Application_Crosschain_Pool_BSC: { [chainId in Safe4NetworkChainId]: string } = {
  [Safe4NetworkChainId.Testnet]: "0x7756B490d4Ce394bB6FBA5559C10a8eDc7b102Fc",
  [Safe4NetworkChainId.Mainnet]: "0x471B9eB32a6750b0356E0C80294Ee035C4bdF60B",
};
// Safe4 SAFE 原生币跨链到 ETH 网络资产池地址
export const Application_Crosschain_Pool_ETH: { [chainId in Safe4NetworkChainId]: string } = {
  [Safe4NetworkChainId.Testnet]: "0xaD016d35FE9148F2a8D8A8d37325ada3B7070386",
  [Safe4NetworkChainId.Mainnet]: "0x30728eBa408684D167CF59828261Db8A2A59E8C7",
};
// Safe4 SAFE 原生币跨链到 MATIC 网络资产池地址
export const Application_Crosschain_Pool_MATIC: { [chainId in Safe4NetworkChainId]: string } = {
  [Safe4NetworkChainId.Testnet]: "0x8b151740b4a5B2bF7dA631AAD83Be627f97F5790",
  [Safe4NetworkChainId.Mainnet]: "0x960Bb626aba915c242301EC47948Ba475CDeC090",
};

// Safe4 USDT 跨链合约地址
export const Application_Crosschain: { [chainId in Safe4NetworkChainId]: string } = {
  [Safe4NetworkChainId.Testnet]: "0x268BFd7F4c5F0531294D9172f5DA84f0CC7812C5",
  [Safe4NetworkChainId.Mainnet]: "0x268BFd7F4c5F0531294D9172f5DA84f0CC7812C5",
};

// WSAFE 合约地址
export const WSAFE: { [chainId in Safe4NetworkChainId]: Token } = {
  [Safe4NetworkChainId.Testnet]: new Token(Safe4NetworkChainId.Testnet as number, "0x64c5aB0DFeCCe653751B463AFb05352085c5f2f9", 18, "WSAFE", "Wrapped SAFE"),
  [Safe4NetworkChainId.Mainnet]: new Token(Safe4NetworkChainId.Mainnet as number, "0x0000000000000000000000000000000000001101", 18, "WSAFE", "Wrapped SAFE"),
};
// USDT 合约地址
export const USDT: { [chainId in Safe4NetworkChainId]: Token } = {
  [Safe4NetworkChainId.Testnet]: new Token(Safe4NetworkChainId.Testnet as number, "0x268BFd7F4c5F0531294D9172f5DA84f0CC7812C5", 18, "USDT", "USDT"),
  [Safe4NetworkChainId.Mainnet]: new Token(Safe4NetworkChainId.Mainnet as number, "0x61873c9478dEB4Bb2c4d04E86e67c45C09377202", 18, "USDT", "USDT"),
};

export const SafeswapV2FactoryAddreess = "0xB3c827077312163c53E3822defE32cAffE574B42";
export const SafeswapV2RouterAddress = "0x6476008C612dF9F8Db166844fFE39D24aEa12271";
export const SafeswapV2InitCodeHash = "0xad0e51aa7a058efb9eb40fd6385473f0175ee7419e8d4f91a4e0294ec12b2d13";

export const Safe4_Network_Config = {
  Testnet: {
    chainId: 6666666,
    // endpoint: "http://47.107.47.210:8545",
    // Safescan_URL: "http://47.107.47.210",
    // Safescan_Api: "http://47.107.47.210:5005"
    endpoint: "https://safe4testnet.anwang.com/rpc",
    Safescan_URL: "https://safe4testnet.anwang.com",
    Safescan_Api: "https://safe4testnet.anwang.com/5005",
    claimFrom: "0x0225302942D5f37dA1d18C1d2DE169C5b007aCAb",
  },
  Mainnet: {
    chainId: 6666665,
    endpoint: "https://safe4.anwang.com/rpc",
    Safescan_URL: "https://safe4.anwang.com",
    Safescan_Api: "https://safe4.anwang.com/5005",
    claimFrom: "0x5DB242e60517a60B65140613D29e86334F2b5739"
    // chainId: 6666666,
    // endpoint: "https://safe4testnet.anwang.com/rpc",
    // Safescan_URL: "https://safe4testnet.anwang.com",
    // Safescan_Api: "https://safe4testnet.anwang.com/5005",
    // claimFrom: "0x0225302942D5f37dA1d18C1d2DE169C5b007aCAb",
  }
}

export const Safe4_Business_Config = {
  Masternode: {
    Create: {
      // 创建主节点时需要锁仓的 SAFE 数量
      LockAmount: 1000,
      // 众筹主节点时需要锁仓的 SAFE 数量
      UnionLockAmount: 200,
      // 锁仓天数
      LockDays: 720
    },
  },
  Supernode: {
    Create: {
      // 创建超级节点时需要锁仓的 SAFE 数量
      LockAmount: 5000,
      // 众筹创建超级节点时需要锁仓的 SAFE 数量
      UnionLockAmount: 1000,
      // 锁仓天数
      LockDays: 720
    }
  }
}
const Config = {
  "dev": {
    Default_Web3_Endpoint: Safe4_Network_Config.Testnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Testnet.chainId,
    Safescan_URL: "http://127.0.0.1:3000",
    Safescan_Api: "http://127.0.0.1:5005",
  },
  "test": {
    Default_Web3_Endpoint: Safe4_Network_Config.Testnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Testnet.chainId,
    Safescan_URL: Safe4_Network_Config.Testnet.Safescan_URL,
    Safescan_Api: Safe4_Network_Config.Testnet.Safescan_Api,
  },
  "prod": {
    Default_Web3_Endpoint: Safe4_Network_Config.Mainnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Mainnet.chainId,
    Safescan_URL: Safe4_Network_Config.Mainnet.Safescan_URL,
    Safescan_Api: Safe4_Network_Config.Mainnet.Safescan_Api,
  }
}
export default Config["prod"]
