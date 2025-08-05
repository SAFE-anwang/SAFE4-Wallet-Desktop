import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { BatchLockAert, BatchLockParams } from "./WalletBatchLockModal-Input";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { GetDiffInDays } from "../../../../utils/DateUtils";
import AddressComponent from "../../../components/AddressComponent";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../utils/EstimateTx";
const { Text, Link } = Typography;

export default ({
  batchLockParams,
  close, setTxHash
}: {
  batchLockParams: BatchLockParams
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const { chainId, provider } = useWeb3React();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const [sending, setSending] = useState<boolean>(false);

  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();

  const totalLockAmount = useMemo(() => {
    const { perLockAmount, lockTimes } = batchLockParams;
    const JSBI_PerLockAmount = JSBI.BigInt(ethers.utils.parseEther(perLockAmount).toString());
    const JSBI_TotalLockAmount = JSBI.multiply(JSBI_PerLockAmount, JSBI.BigInt(lockTimes));
    return CurrencyAmount.ether(JSBI_TotalLockAmount).toExact();
  }, [batchLockParams])

  const doBatchLockTransaction = useCallback(async () => {
    if (accountManaggerContract && chainId && provider) {
      const { startLockMonth, periodMonth, lockTimes, perLockAmount, toAddress } = batchLockParams;
      const _startDay = GetDiffInDays(new Date(`${startLockMonth}-01`));
      const _spaceDay = periodMonth * 30;
      const _times = lockTimes;
      const JSBI_PerLockAmount = JSBI.BigInt(ethers.utils.parseEther(perLockAmount).toString());
      const JSBI_TotalLockAmount = JSBI.multiply(JSBI_PerLockAmount, JSBI.BigInt(lockTimes));
      /**
       * batchDeposit4One(address _to, uint _times, uint _spaceDay, uint _startDay)
       */
      setSending(true);

      const value = JSBI_TotalLockAmount.toString();
      const data = accountManaggerContract.interface.encodeFunctionData("batchDeposit4One", [toAddress, _times, _spaceDay, _startDay]);
      let tx: ethers.providers.TransactionRequest = {
        to: accountManaggerContract.address,
        data,
        value,
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );
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
              value: value.toString()
            }
          });
          setTxHash(hash);
        } catch (err) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
      if (error) {
        setSending(false);
        setErr(error)
      }
    }
  }, [activeAccount, accountManaggerContract, chainId, provider, batchLockParams]);

  return <>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <Row >
        <Col span={24}>
          {
            activeAccount == batchLockParams.toAddress && <LockOutlined style={{ fontSize: "32px" }} />
          }
          <Text style={{ fontSize: "32px" }} strong>{totalLockAmount} SAFE</Text>
        </Col>
      </Row>
      <br />
      <br />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_send_from")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          {
            activeAccount == batchLockParams.toAddress && <Text>{t("wallet_account_normal")}</Text>
          }
          {
            activeAccount != batchLockParams.toAddress && <>
              <AddressComponent address={activeAccount} />
            </>
          }
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_send_to")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          {
            activeAccount == batchLockParams.toAddress && <Text>{t("wallet_account_locked")}</Text>
          }
          {
            activeAccount != batchLockParams.toAddress && <>
              <AddressComponent address={batchLockParams.toAddress} />
            </>
          }
        </Col>
      </Row>
      <Divider />
      <Row >
        <Col span={24}>
          <BatchLockAert batchLockParams={batchLockParams} />
        </Col>
      </Row>
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button onClick={() => {
              doBatchLockTransaction()
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
    </div>
  </>

}
