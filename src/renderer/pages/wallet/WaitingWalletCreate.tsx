import { Alert, Spin, Steps, StepProps, Card, Divider } from "antd"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewMnemonic } from "../../state/application/hooks";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal, Wallet_Methods } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { useWalletsKeystores, useWalletsList } from "../../state/wallets/hooks";
import { WalletKeystore } from "../../state/wallets/reducer";
import { walletsLoadKeystores } from "../../state/wallets/action";
import { applicationActionUpdateAtCreateWallet } from "../../state/application/action";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const newMnemonic = useNewMnemonic();
  const walletsKeystores = useWalletsKeystores();

  const [newWalletKeystore, setNewWalletKeystore] = useState<WalletKeystore>();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStepCurrent] = useState<number>(0);

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
      setStepCurrent(0);
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
        setStepCurrent(1);
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
          setStepCurrent(2);
        }, 300);
      }, 300);
    }, 300);
  };

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on( IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal) {
        const method = arg[1];
        const result = arg[2][0];
        if ( method == Wallet_Methods.generateWallet){
          setNewWalletKeystore(result);
          dispatch(walletsLoadKeystores([result]));
        }else if (method == Wallet_Methods.storeWallet){
          const {
            success, path , error
          } = result;
          if ( success ) {
            setTimeout(() => {
              setStepCurrent(3);
              dispatch(applicationActionUpdateAtCreateWallet(false));
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
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.generateWallet, [newMnemonic, ""]]);
    }
  }, [newMnemonic]);

  useEffect(() => {
    if (newWalletKeystore?.address) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.storeWallet, [walletsKeystores]]);
    }
  }, [newWalletKeystore])

  return (
    <>
      <Spin spinning={true}>
        <Alert
          style={{
            marginTop:"10%"
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
