
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Application_Init, Application_Update_BlockNumber } from "./state/application/action";
import { useBlockNumber } from "./state/application/hooks";

const {
  Web3
} = require("web3")

export default () => {

  const dispatch = useDispatch();
  const rpcUrl = 'http://47.107.47.210:8545'; // 替换为你的 Geth RPC 地址
  const web3 = new Web3(rpcUrl);

  async function doInit(){

    const blockNumber = await web3.eth.getBlockNumber();
    const accounts = await web3.eth.getAccounts();
    dispatch( Application_Init( {
      blockNumber : blockNumber.toString(),
      accounts
    }));

  }

  async function doLoop(){
    setInterval( async () => {
      const _blockNumber = await web3.eth.getBlockNumber();
      dispatch( Application_Update_BlockNumber( _blockNumber.toString() ) )
    } , 10000 )
  }

  useEffect( () =>  {
    doInit();
    doLoop();
  } , [] );

  return (<></>)
}
