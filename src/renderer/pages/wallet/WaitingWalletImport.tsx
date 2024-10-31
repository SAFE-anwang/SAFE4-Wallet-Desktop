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
import { useApplicationPassword, useImportWalletParams } from "../../state/application/hooks";
import { Import_Type_Mnemonic, Import_Type_PrivateKey } from "./import/ImportWallet";
import { HDNode } from "ethers/lib/utils";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const password = useApplicationPassword();
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
          title: t("wallet_import_privateKey_process0"),
          description: t("wallet_mnemonic_create_process_status_executing"),
        },
        {
          title: t("wallet_import_privateKey_process1"),
          description: t("wallet_mnemonic_create_process_status_waiting"),
        }]);
        setStepCurrent(0);
        setTimeout(() => {
          setStepItems([{
            title: t("wallet_import_privateKey_process0"),
            description: t("wallet_mnemonic_create_process_status_finished"),
          },
          {
            title: t("wallet_import_privateKey_process1"),
            description: t("wallet_mnemonic_create_process_status_waiting"),
          }]);
          setStepCurrent(1);
          setTimeout(() => {
            setStepItems([{
              title: t("wallet_import_privateKey_process0"),
              description: t("wallet_mnemonic_create_process_status_finished"),
            },
            {
              title: t("wallet_import_privateKey_process1"),
              description: t("wallet_mnemonic_create_process_status_executing"),
            }]);
            setStepCurrent(2);
          }, 300);
        }, 300);
      }, 300);
    } else {
      setTimeout(() => {
        setStepItems([{
          title: t("wallet_mnemonic_create_process0"),
          description: t("wallet_mnemonic_create_process_status_executing")
        },
        {
          title: t("wallet_mnemonic_create_process1"),
          description: t("wallet_mnemonic_create_process_status_waiting"),
        },
        {
          title: t("wallet_mnemonic_create_process2"),
          description: t("wallet_mnemonic_create_process_status_waiting"),
        }]);
        setStepCurrent(0);
        setTimeout(() => {
          setStepItems([{
            title: t("wallet_mnemonic_create_process0"),
            description: t("wallet_mnemonic_create_process_status_finished"),
          },
          {
            title: t("wallet_mnemonic_create_process1"),
            description: t("wallet_mnemonic_create_process_status_executing"),
          },
          {
            title: t("wallet_mnemonic_create_process2"),
            description: t("wallet_mnemonic_create_process_status_waiting"),
          }]);
          setStepCurrent(1);
          setTimeout(() => {
            setStepItems([{
              title: t("wallet_mnemonic_create_process0"),
              description: t("wallet_mnemonic_create_process_status_finished"),
            },
            {
              title: t("wallet_mnemonic_create_process1"),
              description: t("wallet_mnemonic_create_process_status_finished"),
            },
            {
              title: t("wallet_mnemonic_create_process2"),
              description: t("wallet_mnemonic_create_process_status_executing"),
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
    if (newWalletKeystore?.address && password) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.storeWallet, [walletsKeystores, password]]);
    }
  }, [newWalletKeystore, password])

  return (
    <>
      <Button style={{ marginTop: "10%" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
      <Spin spinning={true}>
        <Alert
          style={{
            marginTop: "10%"
          }}
          type="info"
          message={t("wallet_import")}
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
