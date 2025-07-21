import { Alert, Spin, Steps, StepProps, Card, Divider, Button } from "antd"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal, Wallet_Methods } from "../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { walletsLoadWallets } from "../../state/wallets/action";
import { applicationActionUpdateAtCreateWallet } from "../../state/application/action";
import { LeftOutlined } from '@ant-design/icons';
import { useApplicationInitWalletPassword, useImportWalletParams } from "../../state/application/hooks";
import { Import_Type_Mnemonic, Import_Type_PrivateKey } from "./import/ImportWallet";
import { HDNode } from "ethers/lib/utils";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";
import { useWalletsList } from "../../state/wallets/hooks";

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const importWalletParams = useImportWalletParams();
  const wallets = useWalletsList();
  const [stepItems, setStepItems] = useState<StepProps[]>([]);
  const [stepCurrent, setStepCurrent] = useState<number>(0);
  const initWalletPassword = useApplicationInitWalletPassword();

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
    if (importWalletParams) {
      const importWallet = async () => {
        const { importType, address, mnemonic, password, path, privateKey } = importWalletParams;
        renderStempItems(importType);
        let wallet: {
          publicKey: string,
          address: string,
          path?: string
        } | undefined = undefined;
        if (importType == Import_Type_PrivateKey && privateKey) {
          const _wallet = new ethers.Wallet(privateKey);
          wallet = {
            publicKey: _wallet.publicKey,
            address: _wallet.address
          }
        } else if (importType == Import_Type_Mnemonic) {
          if (mnemonic && path) {
            const _wallet = HDNode.fromMnemonic(mnemonic, password)
              .derivePath(path)
            wallet = {
              path,
              publicKey: _wallet.publicKey,
              address: _wallet.address
            }
          }
        }
        if (wallet != undefined && address == wallet.address) {
          if (importType == Import_Type_PrivateKey && privateKey) {
            const importResult = await window.electron.wallet.importWallet({
              privateKey
            }, initWalletPassword);
          } else if (importType == Import_Type_Mnemonic) {
            const importResult = await window.electron.wallet.importWallet({
              mnemonic, password, path
            }, initWalletPassword);
          }
          const _wallets = wallets.map(wallet => {
            return { ...wallet }
          })
          _wallets.push({
            ...wallet, name: ""
          });
          console.log("Push Wallets ::", _wallets)
          dispatch(walletsLoadWallets(_wallets));
          setTimeout(() => {
            setStepCurrent(3);
            dispatch(applicationActionUpdateAtCreateWallet(false));
            navigate("/main/wallet");
          }, 1500);
        }
      }
      importWallet();
    }
  }, [importWalletParams])

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
