import { Alert, Spin, Button, Steps, StepProps } from "antd"
import { LeftOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewMnemonic } from "../../state/application/hooks";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { useWalletsKeystores, useWalletsList } from "../../state/wallets/hooks";
import { WalletKeystore } from "../../state/wallets/reducer";
import { Wallets_Load_Keystores } from "../../state/wallets/action";
import { Application_Action_Update_AtCreateWallet } from "../../state/application/action";

const method_generateWallet = "generateWallet";
const method_restoreWallet  = "restoreWallet";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const newMnemonic = useNewMnemonic();
  const walletsKeystores = useWalletsKeystores();

  const [newWalletKeystore, setNewWalletKeystore] = useState<WalletKeystore>();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStempCurrent] = useState<number>(0);

  const renderStempItems = () => {
    setTimeout(() => {
      setStepItems([{
        title: '生成种子密钥',
        description: "正在执行",
      },
      {
        title: '生成钱包密钥',
        description: "待执行",
      },
      {
        title: '本地加密存储钱包数据',
        description: "待执行",
      }]);
      setStempCurrent(0);
      setTimeout(() => {
        setStepItems([{
          title: '生成种子密钥',
          description: "完成",
        },
        {
          title: '生成钱包密钥',
          description: "正在执行",
        },
        {
          title: '本地加密存储钱包数据',
          description: "待执行",
        }]);
        setStempCurrent(1);
        setTimeout(() => {
          setStepItems([{
            title: '生成种子密钥',
            description: "完成",
          },
          {
            title: '生成钱包密钥',
            description: "完成",
          },
          {
            title: '本地加密存储钱包数据',
            description: "正在执行",
          }]);
          setStempCurrent(2);
        }, 300);
      }, 300);
    }, 300);
  };

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on( IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal) {
        const method = arg[1];
        const result = arg[2][0];
        if ( method == method_generateWallet){
          setNewWalletKeystore(result);
          dispatch(Wallets_Load_Keystores([result]));
        }else if (method == method_restoreWallet){
          const {
            success, path
          } = result;
          if ( success ) {
            setTimeout(() => {
              setStempCurrent(3);
              dispatch(Application_Action_Update_AtCreateWallet(false));
              navigate("/main/wallet");
            }, 1500);
          }
        }
      }
    });
    return () => {
      remove();
    }
  }, []);

  useEffect(() => {
    if (newMnemonic) {
      renderStempItems();
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, method_generateWallet, [newMnemonic, ""]]);
    }
  }, [newMnemonic]);

  useEffect(() => {
    if (newWalletKeystore?.address) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, method_restoreWallet, [walletsKeystores]]);
    }
  }, [newWalletKeystore])

  return (
    <>
      <Spin spinning={true}>
        <Alert
          style={{
            marginTop:"10px"
          }}
          type="info"
          message="创建钱包"
          description={<>
            <Steps
              direction="vertical"
              current={stepCurrent}
              items={stepItems}
            />
          </>}
        />
      </Spin>
    </>
  );

}
