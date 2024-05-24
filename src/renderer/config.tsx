import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

export const Safe4_Network_Config = {
  Testnet: {
    chainId: 6666666,
    endpoint: "http://47.107.47.210:8545"
  },
  Mainnet: {
    chainId: 6666666,
    endpoint: "http://172.104.162.94:8545"
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
    Default_Web3_Endpoint: "http://47.107.47.210:8545",
    Safescan_URL: "http://127.0.0.1"
  },
  "test": {
    Default_Web3_Endpoint: Safe4_Network_Config.Testnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Testnet.chainId,
    Safescan_URL: "http://127.0.0.1"
  },
  "prod": {
    Default_Web3_Endpoint: Safe4_Network_Config.Mainnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Mainnet.chainId,
    Safescan_URL: "http://safe4.anwang.com"
  }
}

export default Config["test"]
