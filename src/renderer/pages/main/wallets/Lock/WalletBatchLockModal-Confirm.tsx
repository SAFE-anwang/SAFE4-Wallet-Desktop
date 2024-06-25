import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { BatchLockAert, BatchLockParams } from "./WalletBatchLockModal-Input";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { GetDiffInDays } from "../../../../utils/DateUtils";
import AddressComponent from "../../../components/AddressComponent";
const { Text, Link } = Typography;

export default ({
  batchLockParams,
  close, setTxHash
}: {
  batchLockParams: BatchLockParams
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {
  const activeAccount = useWalletsActiveAccount();
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

  const doBatchLockTransaction = useCallback(() => {
    if (accountManaggerContract) {
      const { startLockMonth, periodMonth, lockTimes, perLockAmount, toAddress } = batchLockParams;
      const _startDay = GetDiffInDays(new Date(`${startLockMonth}-01`));
      const _spaceDay = periodMonth * 30;
      const _times = lockTimes;
      const JSBI_PerLockAmount = JSBI.BigInt(ethers.utils.parseEther(perLockAmount).toString());
      const JSBI_TotalLockAmount = JSBI.multiply(JSBI_PerLockAmount, JSBI.BigInt(lockTimes));
      /**
       * batchDeposit(address _to, uint _times, uint _spaceDay, uint _startDay)
       */
      setSending(true);
      accountManaggerContract.batchDeposit4One(toAddress, _times, _spaceDay, _startDay, {
        value: JSBI_TotalLockAmount.toString(),
      }).then((response: any) => {
        const { hash, data } = response;
        setTransactionResponse(response);
        addTransaction({ to: accountManaggerContract.address }, response, {
          call: {
            from: activeAccount,
            to: accountManaggerContract.address,
            input: data,
            value: JSBI_TotalLockAmount.toString()
          }
        });
        setTxHash(hash);
        setSending(false);
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      })
    }
  }, [activeAccount, accountManaggerContract, batchLockParams]);

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
          <Text type="secondary">从</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          {
            activeAccount == batchLockParams.toAddress && <Text>普通账户</Text>
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
          <Text type="secondary">到</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          {
            activeAccount == batchLockParams.toAddress && <Text>锁仓账户</Text>
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
              广播交易
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
              发送中....
            </Button>
          }
          {
            render && <Button onClick={close} type="primary" style={{ float: "right" }}>
              关闭
            </Button>
          }
        </Col>
      </Row>
    </div>
  </>

}
