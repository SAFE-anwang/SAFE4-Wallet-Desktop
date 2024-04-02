import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

export const Safe4_Network_Config = {
  Testnet : {
    chainId : 6666666 ,
    endpoint : "http://172.104.162.94:8545"
  } ,
  Mainnet : {
    chainId : 0,
    endpoint : ""
  }
}

const Config = {
  "dev": {
    Default_Web3_Endpoint: "http://47.107.47.210:8545",
    Safescan_URL: "http://127.0.0.1"
  },
  "test": {
    Default_Web3_Endpoint: "http://47.107.47.210:8545",
    Safescan_URL: "http://47.107.47.210"
  },
  "prod": {
    Default_Web3_Endpoint: "http://172.104.162.94:8545",
    Safescan_URL: "http://safe4.anwang.com"
  }
}

export default Config["prod"]
