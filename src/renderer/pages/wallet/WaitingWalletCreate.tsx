import { Alert, Spin, Steps, StepProps } from "antd"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApplicationInitWalletPassword, useNewMnemonic } from "../../state/application/hooks";
import { useDispatch } from "react-redux";
import { walletsLoadWallets } from "../../state/wallets/action";
import { applicationActionUpdateAtCreateWallet } from "../../state/application/action";
import { useTranslation } from "react-i18next";
import { useWalletsList } from "../../state/wallets/hooks";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const newMnemonic = useNewMnemonic();
  const wallets = useWalletsList();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStepCurrent] = useState<number>(0);
  const initWalletPassword = useApplicationInitWalletPassword();

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
    if (newMnemonic) {
      renderStempItems();
      const importWallet = async () => {
        const importResult = await window.electron.wallet.importWallet({
          mnemonic: newMnemonic
        }, initWalletPassword);
        if (!importResult) return;
        const _wallets = wallets.map(wallet => {
          return { ...wallet }
        })
        _wallets.push({
          ...importResult, name: ""
        });
        dispatch(walletsLoadWallets(_wallets));
        setTimeout(() => {
          setStepCurrent(3);
          dispatch(applicationActionUpdateAtCreateWallet(false));
          navigate("/main/wallet");
        }, 1500);
      }
      importWallet();
    }
  }, [newMnemonic]);


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
