import { useCallback, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
const { Text, Link } = Typography;

export default ({
  amount, lockDay,
  close, setTxHash
}: {
  amount: string,
  lockDay: number,
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

  const doLockTransaction = useCallback(({
    to, amount, lockDay
  }: {
    to: string,
    amount: string,
    lockDay: number
  }) => {
    if (accountManaggerContract) {
      setSending(true);
      accountManaggerContract.deposit(to, lockDay, {
        value: ethers.utils.parseEther(amount),
      }).then((response: any) => {
        const { hash, data } = response;
        setTransactionResponse(response);
        addTransaction({ to: accountManaggerContract.address }, response, {
          call: {
            from: activeAccount,
            to: accountManaggerContract.address,
            input: data,
            value: ethers.utils.parseEther(amount).toString()
          }
        });
        setTxHash(hash);
        setSending(false);
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      })
    }
  }, [activeAccount, accountManaggerContract]);

  return <>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <Row >
        <Col span={24}>
          <LockOutlined style={{ fontSize: "32px" }} />
          <Text style={{ fontSize: "32px" }} strong>{amount} SAFE</Text>
        </Col>
      </Row>
      <br />
      <br />
      <Row>
        <Col span={24}>
          <Text type="secondary">从</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text>普通账户</Text>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={24}>
          <Text type="secondary">到</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text>锁仓账户</Text>
        </Col>
      </Row>
      <Divider />
      <Row >
        <Col span={24}>
          <Text type="secondary">锁仓天数</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            {lockDay} 天
          </Text>
        </Col>
      </Row>
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button onClick={() => {
              doLockTransaction({
                to: activeAccount,
                amount,
                lockDay
              })
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
