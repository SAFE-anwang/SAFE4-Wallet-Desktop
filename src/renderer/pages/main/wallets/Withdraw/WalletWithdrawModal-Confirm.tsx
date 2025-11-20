import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useSafe4Balance, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import { AccountRecord } from "../../../../structs/AccountManager";
import { RetweetOutlined } from '@ant-design/icons';
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../utils/EstimateTx";
const { Text } = Typography;

export default ({
  accountRecord, cancel,
  setTxHash
}: {
  accountRecord?: AccountRecord,
  cancel: () => void,
  setTxHash: (txHash: string) => void
}) => {
  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract();
  const [sending, setSending] = useState<boolean>(false);
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const { chainId, provider } = useWeb3React();

  const withdrawAmount = useMemo(() => {
    if (accountRecord) {
      return accountRecord.amount.toFixed(6);
    } else {
      return safe4balance?.avaiable?.amount?.toFixed(6);
    }
  }, [accountRecord, safe4balance]);

  const doWithdrawTransaction = useCallback(async () => {
    if (activeAccount && accountManaggerContract && chainId && provider) {
      setSending(true);
      if (accountRecord) {
        const data = accountManaggerContract.interface.encodeFunctionData("withdrawByID", [[accountRecord.id]]);
        let tx: ethers.providers.TransactionRequest = {
          to: accountManaggerContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            setErr(error);
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: accountManaggerContract.address }, response, {
              call: {
                from: activeAccount,
                to: accountManaggerContract.address,
                input: data,
                value: "0"
              },
              withdrawAmount: withdrawAmount && ethers.utils.parseEther(withdrawAmount).toString()
            });
            setTxHash(hash);
          }
        } catch (err: any) {
          setErr(err);
        } finally {
          setSending(false);
        }
      } else {
        const data = accountManaggerContract.interface.encodeFunctionData("withdraw", []);
        let tx: ethers.providers.TransactionRequest = {
          to: accountManaggerContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: accountManaggerContract.address }, response, {
              call: {
                from: activeAccount,
                to: accountManaggerContract.address,
                input: data,
                value: "0"
              },
              withdrawAmount: withdrawAmount && ethers.utils.parseEther(withdrawAmount).toString()
            });
            setTxHash(hash);
          }
          if (error) {
            setSending(false);
            setErr(error)
          }
        } catch (err: any) {
          setErr(err)
        } finally {
          setSending(false);
        }

      }
    }
  }, [activeAccount, accountManaggerContract, withdrawAmount, chainId, provider]);

  return <>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      {
        !accountRecord && <>
          <Row >
            <Col span={24}>
              <RetweetOutlined style={{ fontSize: "32px" }} />
              <Text style={{ fontSize: "32px" }} strong>{withdrawAmount} SAFE</Text>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={24}>
              <Text type="secondary">{t("wallet_send_from")}</Text>
            </Col>
            <Col span={24} style={{ paddingLeft: "5px" }} >
              <Text>{t("wallet_account_locked")}</Text>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={24}>
              <Text type="secondary">{t("wallet_send_to")}</Text>
            </Col>
            <Col span={24} style={{ paddingLeft: "5px" }} >
              <Text>{t("wallet_account_normal")}</Text>
            </Col>
          </Row>
        </>
      }
      {
        accountRecord && <>
          <Row >
            <Col span={24}>
              <RetweetOutlined style={{ fontSize: "32px" }} />
              <Text style={{ fontSize: "32px" }} strong>{withdrawAmount} SAFE</Text>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={24}>
              <Text type="secondary">{t("wallet_send_from")}</Text>
            </Col>
            <Col span={24} style={{ paddingLeft: "5px" }} >
              <Text>{t("wallet_account_locked")}</Text>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={24}>
              <Text type="secondary">{t("wallet_send_to")}</Text>
            </Col>
            <Col span={24} style={{ paddingLeft: "5px" }} >
              <Text>{t("wallet_account_normal")}</Text>
            </Col>
          </Row>
        </>
      }
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button onClick={() => {
              doWithdrawTransaction()
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_broadcast")}
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_sending")}
            </Button>
          }
          {
            render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_close")}
            </Button>
          }
        </Col>
      </Row>
    </div>

  </>

}
