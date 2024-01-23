import { useCallback, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { TransactionResponse } from "@ethersproject/providers";
const { Text , Link } = Typography;

export default ({
  amount, lockDay, close
}: {
  amount: string,
  lockDay: number,
  close: () => void
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

  const doLockTransaction = useCallback(({
    to, amount, lockDay
  }: {
    to: string,
    amount: string,
    lockDay: number
  }) => {
    setSending(true);
    if (accountManaggerContract) {
      accountManaggerContract.deposit(to, lockDay, {
        value: ethers.utils.parseEther(amount)
      }).then((response: any) => {
        setSending(false);
        const { hash , data } = response;
        setTransactionResponse(response);
        addTransaction( { to:accountManaggerContract.address } , response, {
          call : {
            from : activeAccount,
            to : accountManaggerContract.address,
            input : data,
            value : ethers.utils.parseEther(amount).toString()
          }
        });
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      })
    }
  }, [activeAccount ,accountManaggerContract]);

  return <>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <br />
      <Row >
        <Col span={14}>
          <Text strong>数量</Text>
          <br />
          {amount}
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>锁仓天数</Text>
          <br />
          {lockDay}
        </Col>
      </Row>
      <br />
      <br />
      <br />
      <br />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<LockOutlined />} onClick={() => {
              doLockTransaction({
                to: activeAccount,
                amount,
                lockDay
              })
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              发送交易
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
