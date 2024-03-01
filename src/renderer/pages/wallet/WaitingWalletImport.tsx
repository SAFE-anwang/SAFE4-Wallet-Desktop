import { Alert, Spin, Steps, StepProps, Card, Divider, Button } from "antd"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal, Wallet_Methods } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { useWalletsKeystores, useWalletsList } from "../../state/wallets/hooks";
import { WalletKeystore } from "../../state/wallets/reducer";
import { walletsLoadKeystores } from "../../state/wallets/action";
import { applicationActionUpdateAtCreateWallet } from "../../state/application/action";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useImportWalletParams } from "../../state/application/hooks";
import { Import_Type_Mnemonic, Import_Type_PrivateKey } from "./import/ImportWallet";
import { HDNode } from "ethers/lib/utils";
import { ethers } from "ethers";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const importWalletParams = useImportWalletParams();
  const walletsKeystores = useWalletsKeystores();
  const [newWalletKeystore, setNewWalletKeystore] = useState<WalletKeystore>();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStepCurrent] = useState<number>(0);

  const goBackClick = () => {
    navigate("/wallet/importWallet")
  }

  const renderStempItems = (importType: string) => {
    if (importType == Import_Type_PrivateKey) {
      setTimeout(() => {
        setStepItems([{
          title: '导入钱包私钥',
          description: "正在执行",
        },
        {
          title: '本地加密存储钱包数据',
          description: "待执行",
        }]);
        setStepCurrent(0);
        setTimeout(() => {
          setStepItems([{
            title: '导入钱包私钥',
            description: "完成",
          },
          {
            title: '本地加密存储钱包数据',
            description: "待执行",
          }]);
          setStepCurrent(1);
          setTimeout(() => {
            setStepItems([{
              title: '导入钱包私钥',
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
    } else {
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
    }

  };

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal) {
        const method = arg[1];
        const result = arg[2][0];
        if (method == Wallet_Methods.storeWallet) {
          const {
            success, path, error
          } = result;
          if (success) {
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
    if (importWalletParams) {
      const { importType, address, mnemonic, password, path, privateKey } = importWalletParams;
      renderStempItems(importType);
      let wallet: any;
      if (importType == Import_Type_PrivateKey && privateKey) {
        const _wallet = new ethers.Wallet(privateKey);
        wallet = {
          mnemonic: undefined,
          path: undefined,
          password: undefined,
          privateKey: _wallet.privateKey,
          publicKey: _wallet.publicKey,
          address: _wallet.address
        }
      } else if (importType == Import_Type_Mnemonic) {
        if (mnemonic && path) {
          const _wallet = HDNode.fromMnemonic(mnemonic, password)
            .derivePath(path)
          wallet = {
            mnemonic: mnemonic,
            path,
            password,
            privateKey: _wallet.privateKey,
            publicKey: _wallet.publicKey,
            address: _wallet.address
          }
        }
      }
      if (wallet != undefined && address == wallet.address) {
        setNewWalletKeystore(wallet);
        dispatch(walletsLoadKeystores([wallet]));
      }
    }
  }, [importWalletParams])

  useEffect(() => {
    if (newWalletKeystore?.address) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.storeWallet, [walletsKeystores]]);
    }
  }, [newWalletKeystore])

  return (
    <>
      <Button style={{ marginTop: "10%" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
      <Spin spinning={true}>
        <Alert
          style={{
            marginTop: "10%"
          }}
          type="info"
          message="导入钱包"
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
