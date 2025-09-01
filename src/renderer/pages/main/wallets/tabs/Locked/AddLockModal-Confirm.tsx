import { Alert, Button, Col, Divider, Input, Row, Typography } from "antd"
import { AccountRecord } from "../../../../../structs/AccountManager"
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { DateTimeFormat } from "../../../../../utils/DateUtils";
import { LockOutlined } from "@ant-design/icons";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";
import { useAccountManagerContract } from "../../../../../hooks/useContracts";
import { useCallback, useEffect, useState } from "react";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import EstimateTx from "../../../../../utils/EstimateTx";

const { Text } = Typography;

export default ({
  selectedAccountRecord,
  addLockDay,
  close,
  setTxHash
}: {
  selectedAccountRecord: AccountRecord,
  addLockDay: number,
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const [sending, setSending] = useState<boolean>(false);
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();

  const {
    id, amount, unlockHeight
  } = selectedAccountRecord;
  const locked = unlockHeight > blockNumber;
  const unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
  const { provider, chainId } = useWeb3React();

  const doAddLockDay = useCallback(async (id: number, addLockDay: number) => {
    if (accountManaggerContract && provider && chainId) {
      setSending(true);

      const data = accountManaggerContract.interface.encodeFunctionData("addLockDay", [
        id, addLockDay
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: accountManaggerContract.address,
        data,
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider, { doubleGasLimit: true });
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );
      if (error) {
        setSending(false);
        setErr(error)
      }
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: accountManaggerContract.address }, response, {
            call: {
              from: activeAccount,
              to: accountManaggerContract.address,
              input: data,
              value: "0"
            }
          });
          setTxHash(hash);
        } catch (err) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
    }
  }, [accountManaggerContract, activeAccount]);

  return <>
    <Row>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      {
        render
      }
      <Col span={24}>
        <Text type="secondary">{t("wallet_locked_accountRecordLockId")}</Text>
        <br />
        <Text strong>
          {
            locked && <LockOutlined />
          }
          {id}
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">{t("wallet_locked_lockedAmount")}</Text>
        <br />
        <Text strong>{amount.toFixed(2)} SAFE</Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">{t("wallet_locked_unlockHeight")}</Text>
        <br />
        <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
        {
          unlockDateTime && <Text strong style={{ float: "right" }} type="secondary">[{unlockDateTime}]</Text>
        }
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Text type="secondary" strong>{t("wallet_locked_addLockDay")}</Text>
        <br />
        <Text strong>{addLockDay} {t("days")}</Text>
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Row style={{ width: "100%", textAlign: "right" }}>
          <Col span={24}>
            {
              !sending && !render && <Button onClick={() => {
                doAddLockDay(selectedAccountRecord.id, addLockDay)
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
              render && <Button onClick={close} type="primary" style={{ float: "right" }}>
                {t("wallet_send_status_close")}
              </Button>
            }
          </Col>
        </Row>
      </Col>
    </Row>
  </>

}
