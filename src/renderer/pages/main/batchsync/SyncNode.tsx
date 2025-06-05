import { SyncNodeTask } from "./BatchSyncNode";
import SSH2CMDTerminalNode from "../../components/SSH2CMDTerminalNode";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc";


export default ({
  successCallback, failedCallback, task, sshConfig, addressConfig
}: {
  successCallback: (task: SyncNodeTask, enode: string, nodeAddress: string) => void,
  failedCallback: (task: SyncNodeTask) => void,
  task: SyncNodeTask,
  sshConfig: SSH2ConnectConfig,
  addressConfig: {
    address?: string,
    privKey?: string
  }
}) => {

  return <>
    <SSH2CMDTerminalNode
      nodeAddress={addressConfig.address ? addressConfig.address : ""}
      nodeAddressPrivateKey={addressConfig.privKey}
      isSupernode={false}
      sshConfig={sshConfig}
      onSuccess={(enode: string, nodeAddress) => {
        successCallback(task, enode, nodeAddress);
      }}
      onError={() => { }}
    />
  </>

}
