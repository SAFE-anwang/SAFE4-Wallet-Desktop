import { Alert, Spin, Switch, Button, Steps, StepProps } from "antd"
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewMnemonic, useWalletList } from "../../state/application/hooks";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { Application_New_Wallet, Application_Update_AtCreateWallet } from "../../state/application/action";
import { Wallet } from "../../state/application/reducer";

const method_generateWallet = "generateWallet";
const method_restoreWallet  = "restoreWallet";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const newMnemonic = useNewMnemonic();
  const walletList = useWalletList();
  const goBackClick = () => {
    navigate("/wallet/createMnemonic")
  }

  const [newWallet, setNewWallet] = useState<Wallet>();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStempCurrent] = useState<number>(0);
  const [spinning, setSpinning] = useState(true);
  const [finish, setFinish] = useState(false);

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
      console.log("effect >> " , arg)
      if (arg instanceof Array && arg[0] == WalletSignal) {
        const method = arg[1];
        const result = arg[2][0];
        if ( method == method_generateWallet){
          setNewWallet(result)
          dispatch(Application_New_Wallet(result))
        }else if (method == method_restoreWallet){
          const {
            success, path
          } = result;
          if (success) {
            setTimeout(() => {
              setStempCurrent(3);
              setSpinning(false);
              navigate("/main/wallet");
              dispatch(Application_Update_AtCreateWallet(false));
            }, 2000);
          }
        }
      }
    });

    return () => {
      remove();
      console.log("finish , " , remove)
    }
  }, []);

  useEffect(() => {
    if (newMnemonic) {
      renderStempItems();
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, method_generateWallet, [newMnemonic, ""]]);
    }
  }, [newMnemonic]);

  useEffect(() => {
    if (newWallet?.address) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, method_restoreWallet, [walletList]]);
    }
  }, [newWallet])


  return (
    <>
      <Button size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
      <Spin spinning={spinning}>
        <Alert
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
