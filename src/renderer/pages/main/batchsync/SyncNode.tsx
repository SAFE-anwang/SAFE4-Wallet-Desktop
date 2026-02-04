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

  const [err, setErr] = useState<any | undefined>(undefined);

  useEffect(() => {
    const getPrivateKey = async () => {
      if (addressConfig.privKey) {
        try {
          let pk = await window.electron.wallet.drivePkByPath(activeAccount, addressConfig.privKey);
          while (pk == false) {
            await new Promise(resolve => setTimeout(resolve, 500));
            pk = await window.electron.wallet.drivePkByPath(activeAccount, addressConfig.privKey);
          }
          if (typeof pk === "string") {
            setPrivateKey(pk);
          }
        } catch (error) {
          setErr(error);
        }
      }
    }
    getPrivateKey();
  }, [activeAccount])

  return <>
    {
      <>
        {JSON.stringify(addressConfig)}
      </>
    }
    {
      err && <>
        <Text strong italic>错误获取节点地址私钥 : {JSON.stringify(err)}</Text>
      </>
    }
    {
      privateKey &&
      <>
        <br />
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
