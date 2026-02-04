import { SyncNodeTask } from "./BatchSyncNode";
import SSH2CMDTerminalNode from "../../components/SSH2CMDTerminalNode";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc";
import { useEffect, useState } from "react";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Typography } from "antd";

const { Text } = Typography;


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
  const [privateKey, setPrivateKey] = useState<string | undefined>();
  const activeAccount = useWalletsActiveAccount();
  useEffect(() => {
    const getPrivateKey = async () => {
      if (addressConfig.privKey) {
        const pk = await window.electron.wallet.drivePkByPath(activeAccount, addressConfig.privKey);
        setPrivateKey(pk);
      }
    }
    getPrivateKey();
  }, [activeAccount])

  return <>
    {
      privateKey &&
      <>
        <Text strong italic>SSH2CMDTerminalNode</Text>
        <SSH2CMDTerminalNode
          nodeAddress={addressConfig.address ? addressConfig.address : ""}
          nodeAddressPrivateKey={privateKey}
          isSupernode={false}
          sshConfig={sshConfig}
          onSuccess={(enode: string, nodeAddress) => {
            successCallback(task, enode, nodeAddress);
          }}
          onError={() => { }}
        />
      </>

    }


  </>

}
