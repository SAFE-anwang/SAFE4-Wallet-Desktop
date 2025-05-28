import { useEffect } from "react"
import { SyncNodeTask } from "./BatchSyncNode";
import SSH2CMDTerminal from "../../components/SSH2CMDTerminal";
import SSH2CMDTerminalNode from "../../components/SSH2CMDTerminalNode";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default ({
  successCallback, failedCallback, task
}: {
  successCallback: (task: SyncNodeTask) => void,
  failedCallback: (task: SyncNodeTask) => void,
  task: SyncNodeTask
}) => {

  // useEffect(() => {
  //   const randomNum = randomInt(1, 20);
  //   setTimeout(() => {
  //     console.log("模拟完成任务...", task.title)
  //     successCallback(task)
  //   }, 1000 * randomNum);
  //   return () => {
  //   }
  // }, []);

  return <>
    <SSH2CMDTerminalNode
      nodeAddress="0x14659A2eB71b724bDbDf8F89589a3fa38C954463"
      nodeAddressPrivateKey="0x1594b7dea450e98ab0d4d7ef238c77160a8ac128cb251ed7112e993a5640497f"
      isSupernode
      IP="39.108.69.183"
      onSuccess={() => {}}
      onError={() => {}}
    />
  </>

}
