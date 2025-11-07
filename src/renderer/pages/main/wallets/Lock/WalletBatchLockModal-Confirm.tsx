import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract, useBatchLockOneCentContract, useBatchLockTenCentsContract } from "../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { BatchLockAert, BatchLockParams } from "./WalletBatchLockModal-Input";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { GetDiffInDays } from "../../../../utils/DateUtils";
import AddressComponent from "../../../components/AddressComponent";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../utils/EstimateTx";
import { ONE } from "@uniswap/sdk/dist/constants";
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
  const batchLockTenCentsContract = useBatchLockTenCentsContract();
  const batchLockOneCentContract = useBatchLockOneCentContract();
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
    if (accountManaggerContract && chainId && provider && batchLockTenCentsContract && batchLockOneCentContract) {

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

      const JSBI_ONE_ETHER = JSBI.BigInt(ethers.utils.parseEther("1").toString());
      const JSBI_TENCENTS_ETHER = JSBI.BigInt(ethers.utils.parseEther("0.1").toString());
      const JSBI_ONECENTS_ETHER = JSBI.BigInt(ethers.utils.parseEther("0.01").toString());

      let data = undefined;
      let to = undefined;
      if (JSBI.GE(JSBI_PerLockAmount, JSBI_ONE_ETHER)) {
        console.log("执行大于1锁仓");
        data = accountManaggerContract.interface.encodeFunctionData("batchDeposit4One", [toAddress, _times, _spaceDay, _startDay]);
        to = accountManaggerContract.address;
      } else if (JSBI.GE(JSBI_PerLockAmount, JSBI_TENCENTS_ETHER)) {
        console.log("执行[0.1~1)锁仓");
        data = batchLockTenCentsContract.interface.encodeFunctionData("batchDeposit4One", [toAddress, _times, _spaceDay, _startDay]);
        to = batchLockTenCentsContract.address;
      } else if (JSBI.GE(JSBI_PerLockAmount, JSBI_ONECENTS_ETHER)) {
        console.log("执行[0.01~0.1)锁仓");
        data = batchLockOneCentContract.interface.encodeFunctionData("batchDeposit4One", [toAddress, _times, _spaceDay, _startDay]);
        to = batchLockOneCentContract.address;
      }
      if (data == undefined || to == undefined) return;
      const value = JSBI_TotalLockAmount.toString();
      let tx: ethers.providers.TransactionRequest = {
        to,
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
          addTransaction({ to }, response, {
            call: {
              from: activeAccount,
              to,
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
