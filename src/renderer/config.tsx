import { Channels } from "../main/preload";
export const IPC_CHANNEL: Channels = "ipc-example";

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
    Safescan_URL: "http://172.104.162.94"
  }
}

export default Config["prod"]
