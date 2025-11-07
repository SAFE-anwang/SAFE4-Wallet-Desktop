import { Alert, Button, Col, Divider, Input, InputNumber, Row, Typography } from "antd"
import { AccountRecord } from "../../../../../structs/AccountManager"
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { DateTimeFormat } from "../../../../../utils/DateUtils";
import { LockOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { JSBI } from "@uniswap/sdk";
import { EmptyContract } from "../../../../../constants/SystemContracts";
import { useTranslation } from "react-i18next";
import { useAccountManagerContract, useBatchLockOneCentContract, useBatchLockTenCentsContract } from "../../../../../hooks/useContracts";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import EstimateTx from "../../../../../utils/EstimateTx";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";

const { Text } = Typography;

export default ({
  selectedAccountRecord,
  close,
  setTxHash
}: {
  selectedAccountRecord: AccountRecord,
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {

  const { t } = useTranslation();
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const {
    id, amount, unlockHeight, recordUseInfo
  } = selectedAccountRecord;
  const locked = unlockHeight > blockNumber;
  const unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
  const isMemberOfNode = useMemo(() => {
    if (recordUseInfo && recordUseInfo.frozenAddr && recordUseInfo.frozenAddr != EmptyContract.EMPTY) {
      return true;
    }
    return false;
  }, [recordUseInfo])
  const [addLockDay, setAddLockDay] = useState<string>(isMemberOfNode ? "360" : "");
  const [addLockDayError, setAddLockDayError] = useState<string>();

  const contractAddress = selectedAccountRecord.contractAddress;
  const _accountManaggerContract = useAccountManagerContract();
  const batchLockTencentsContract = useBatchLockTenCentsContract();
  const batchLockOnecentContract = useBatchLockOneCentContract();
  const accountManaggerContract = useMemo(() => {
    if (batchLockTencentsContract?.address == contractAddress) {
      return batchLockTencentsContract;
    }
    if (batchLockOnecentContract?.address == contractAddress) {
      return batchLockOnecentContract;
    }
    return _accountManaggerContract;
  }, [contractAddress, _accountManaggerContract, batchLockTencentsContract, batchLockOnecentContract]);
  const { provider, chainId } = useWeb3React();
  const [sending, setSending] = useState<boolean>(false);
  const activeAccount = useWalletsActiveAccount();
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();

  const goNext = async () => {
    let _addLockDayError;
    if (!addLockDay) {
      _addLockDayError = t("please_enter") + t("wallet_locked_addLockDay");
    } else {
      try {
        const _lockDay = JSBI.BigInt(addLockDay);
        if (JSBI.greaterThan(JSBI.BigInt(1), _lockDay)) {
          _addLockDayError = t("enter_correct") + t("days");
        }
        if (JSBI.greaterThan(_lockDay, JSBI.BigInt(3666))) {
          _addLockDayError = t("enter_correct") + t("days");
        }
      } catch (error) {
        _addLockDayError = t("enter_correct") + t("days");
      }
    }
    if (_addLockDayError) {
      setAddLockDayError(_addLockDayError);
      return;
    }
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
  }

  return <>
    <Row>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Alert type="info" showIcon message={<>
          {t("wallet_addlockdays_tipforid")} <Text strong type="secondary">[ID={selectedAccountRecord?.id}]</Text> {t("wallet_addlockdays_addlockday")}
        </>} />
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        {
          render
        }
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
      {
        isMemberOfNode &&
        <Col span={24}>
          <Alert style={{ marginBottom: "20px" }} showIcon type="info" message={t("wallet_addlockdays_tipfornode")} />
        </Col>
      }
      <Col span={24}>
        <Text type="secondary" strong>{t("wallet_locked_addLockDay")}</Text>
        <br />
        {
          !isMemberOfNode &&
          <Input placeholder={t("enter") + t("wallet_locked_addLockDay")} style={{ width: "30%" }} onChange={(event) => {
            const input = event.target.value.trim();
            setAddLockDay(input);
            setAddLockDayError(undefined);
          }} />
        }
        {
          isMemberOfNode &&
          <InputNumber size="large" defaultValue={360} step={360} min={360} max={3600} onKeyPress={(e) => e.preventDefault()} style={{ width: "30%" }} onChange={(value) => {
            setAddLockDay(value + "");
          }} />
        }
        <br />
        {
          addLockDayError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addLockDayError} />
        }
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Row style={{ width: "100%", textAlign: "right" }}>
          <Col span={24}>
            {
              !sending && !render && <Button onClick={() => {
                goNext()
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
