import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

export const Safe4_Network_Config = {
  Testnet: {
    chainId: 6666666,
    // endpoint: "http://47.107.47.210:8545",
    // Safescan_URL: "http://47.107.47.210",
    // Safescan_Api: "http://47.107.47.210:5005"
    endpoint: "https://safe4testnet.anwang.com/rpc",
    Safescan_URL: "https://safe4testnet.anwang.com",
    Safescan_Api: "https://safe4testnet.anwang.com/5005",
    claimFrom:"0x0225302942D5f37dA1d18C1d2DE169C5b007aCAb",
  },
  Mainnet: {
    chainId: 6666665,
    endpoint: "https://safe4.anwang.com/rpc",
    Safescan_URL: "https://safe4.anwang.com",
    Safescan_Api: "https://safe4.anwang.com/5005",
    claimFrom:"0x5DB242e60517a60B65140613D29e86334F2b5739"
    // chainId: 6666666,
    // endpoint: "https://safe4testnet.anwang.com/rpc",
    // Safescan_URL: "https://safe4testnet.anwang.com",
    // Safescan_Api: "https://safe4testnet.anwang.com/5005"
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
    claimFrom:"",
  },
  "test": {
    Default_Web3_Endpoint: Safe4_Network_Config.Testnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Testnet.chainId,
    Safescan_URL: Safe4_Network_Config.Testnet.Safescan_URL,
    Safescan_Api: Safe4_Network_Config.Testnet.Safescan_Api,
    claimFrom:"0x0225302942D5f37dA1d18C1d2DE169C5b007aCAb",
  },
  "prod": {
    Default_Web3_Endpoint: Safe4_Network_Config.Mainnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Mainnet.chainId,
    Safescan_URL: Safe4_Network_Config.Mainnet.Safescan_URL,
    Safescan_Api: Safe4_Network_Config.Mainnet.Safescan_Api,
    claimFrom:"",
  }
}

export default Config["test"]
