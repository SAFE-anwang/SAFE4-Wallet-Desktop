
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Application_Init, Application_Update_BlockNumber, Application_Update_SysInfo } from "./state/application/action";
import { useBlockNumber } from "./state/application/hooks";
import { IPC_CHANNEL } from "./config";
import { SysInfoSignal } from "../main/handlers/SysInfoSignalHandler";

const {
  Web3
} = require("web3");

export default () => {

  const dispatch = useDispatch();
  const rpcUrl = 'http://47.107.47.210:8545'; // 替换为你的 Geth RPC 地址
  const web3 = new Web3(rpcUrl);

  async function doInit() {
    const blockNumber = await web3.eth.getBlockNumber();
    const accounts = await web3.eth.getAccounts();
    dispatch(Application_Init({
      blockNumber: blockNumber.toString(),
      accounts
    }));
  }

  async function doLoop() {
    setInterval(async () => {
      const _blockNumber = await web3.eth.getBlockNumber();
      dispatch(Application_Update_BlockNumber(_blockNumber.toString()))
    }, 10000)
  }

  async function doLoadSysInfo() {
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [SysInfoSignal, 'get']);
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      // eslint-disable-next-line no-console
      if (arg instanceof Array && arg[0] == SysInfoSignal) {
        console.log("load SysInfo =>" , arg[0]);
        dispatch( Application_Update_SysInfo(arg[1]) )
      }
    });
  }

  useEffect(() => {

    doLoadSysInfo();

    doInit();
    // doLoop();
    
  }, []);

  return (<></>)
}

