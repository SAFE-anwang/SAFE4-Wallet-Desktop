import { Alert, Spin, Steps, StepProps, Card, Divider } from "antd"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApplicationPassword, useNewMnemonic } from "../../state/application/hooks";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal, Wallet_Methods } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { useWalletsKeystores, useWalletsList } from "../../state/wallets/hooks";
import { WalletKeystore } from "../../state/wallets/reducer";
import { walletsLoadKeystores } from "../../state/wallets/action";
import { applicationActionUpdateAtCreateWallet } from "../../state/application/action";
import { useTranslation } from "react-i18next";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const password = useApplicationPassword();
  const newMnemonic = useNewMnemonic();
  const walletsKeystores = useWalletsKeystores();

  const [newWalletKeystore, setNewWalletKeystore] = useState<WalletKeystore>();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStepCurrent] = useState<number>(0);

  const renderStempItems = () => {
    setTimeout(() => {
      setStepItems([{
        title: t("wallet_mnemonic_create_process0"),
        description: t("wallet_mnemonic_create_process_status_executing"),
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
  };

  useEffect(() => {
    const remove = window.electron.ipcRenderer.on(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal) {
        const method = arg[1];
        const result = arg[2][0];
        if (method == Wallet_Methods.generateWallet) {
          setNewWalletKeystore(result);
          dispatch(walletsLoadKeystores([result]));
        } else if (method == Wallet_Methods.storeWallet) {
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
    if (newMnemonic) {
      renderStempItems();
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.generateWallet, [newMnemonic, ""]]);
    }
  }, [newMnemonic]);

  useEffect(() => {
    if (newWalletKeystore?.address && password) {
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, Wallet_Methods.storeWallet, [walletsKeystores, password]]);
    }
  }, [newWalletKeystore])

  return (
    <>
      <Spin spinning={true}>
        <Alert
          style={{
            marginTop: "10%"
          }}
          type="info"
          message={t("wallet_create")}
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
