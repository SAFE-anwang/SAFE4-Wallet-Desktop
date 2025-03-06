import { ChainId, Token } from "@uniswap/sdk";
import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

export enum Safe4NetworkChainId {
  Testnet = 6666666,
  Mainnet = 6666665
}

export const Application_Crosschain : { [chainId in Safe4NetworkChainId] : string } = {
  [ Safe4NetworkChainId.Testnet ] : "0xCab64f959C4FB937Df2Aca96f457B7bc9edcBCb7",
  [ Safe4NetworkChainId.Mainnet ] : "0xCab64f959C4FB937Df2Aca96f457B7bc9edcBCb7",
};

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

    // DEFAULT ERC20 Token
    WSAFE: new Token(
      ChainId.MAINNET,
      "0xFbB4864b5EF17F28Da7e1bE993121cABd71834C4",
      18,
      "WSAFE", "WSAFE"
    ),
    USDT: new Token(
      ChainId.MAINNET,
      "0x5d3869C23930AD86E2b88DD14245238064EA39B6",
      18,
      "USDT", "USDT"
    ),

  },
  Mainnet: {
    // chainId: 6666665,
    // endpoint: "https://safe4.anwang.com/rpc",
    // Safescan_URL: "https://safe4.anwang.com",
    // Safescan_Api: "https://safe4.anwang.com/5005",
    // claimFrom:"0x5DB242e60517a60B65140613D29e86334F2b5739"
    chainId: 6666666,
    endpoint: "https://safe4testnet.anwang.com/rpc",
    Safescan_URL: "https://safe4testnet.anwang.com",
    Safescan_Api: "https://safe4testnet.anwang.com/5005",
    claimFrom: "0x0225302942D5f37dA1d18C1d2DE169C5b007aCAb",

    // DEFAULT ERC20 Token
    WSAFE: new Token(
      ChainId.MAINNET,
      "0xFbB4864b5EF17F28Da7e1bE993121cABd71834C4",
      18,
      "WSAFE", "WSAFE"
    ),
    USDT: new Token(
      ChainId.MAINNET,
      "0x5d3869C23930AD86E2b88DD14245238064EA39B6",
      18,
      "USDT", "USDT"
    ),
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
    claimFrom: "",
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

export default Config["test"]
