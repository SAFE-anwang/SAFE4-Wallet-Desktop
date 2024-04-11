import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

export const Safe4_Network_Config = {
  Testnet: {
    chainId: 6666666,
    endpoint: "http://172.104.162.94:8545"
  },
  Mainnet: {
    chainId: 6666666,
    endpoint: "http://172.104.162.94:8545"
  }
}

export const Safe4_Business_Config = {
  Masternode : {

  } ,
  Supernode : {
    Register : {
      LockAmount : 5000,
      UnionLockAmount : 1000 ,
      LockDays : 720
    } ,
    Append : {

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
    Safescan_URL: "http://safe4.anwang.com"
  },
  "prod": {
    Default_Web3_Endpoint: Safe4_Network_Config.Mainnet.endpoint,
    Default_Web3_ChainId: Safe4_Network_Config.Mainnet.chainId,
    Safescan_URL: "http://safe4.anwang.com"
  }
}

export default Config["test"]
