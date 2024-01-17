import { useCallback, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
const { Text , Link } = Typography;

export default ({
  amount, lockDay, close
}: {
  amount: string,
  lockDay: number,
  close: () => void
}) => {

  const signer = useWalletsActiveSigner();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const [sending, setSending] = useState<boolean>(false);
  const [showErrorDetail, setShowErrorDetail] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<{
    txHash: string | null,
    error: any | null
  }>();

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
        const { hash } = response;
        setRpcResponse({
          txHash: hash,
          error: null
        })
      }).catch((err: any) => {
        setSending(false);
        setRpcResponse({
          txHash: null,
          error: err
        });
      })
    }
  }, [accountManaggerContract]);



  return <>
    <div style={{ minHeight: "300px" }}>

      <div style={{ marginBottom: "20px" }}>
        {
          rpcResponse?.error && <Alert
            message="错误"
            description={
              <>
                <Text>{rpcResponse.error.reason}</Text>
                <br />
                {
                  !showErrorDetail && <Link onClick={() => {
                    setShowErrorDetail(true)
                  }}>[查看错误信息]</Link>
                }
                {
                  showErrorDetail && <>
                    {JSON.stringify(rpcResponse.error)}
                  </>
                }
              </>
            }
            type="error"
            showIcon
          />
        }
        {
          rpcResponse?.txHash && <Alert
            message="交易哈希"
            description={
              <>
                <Text>{rpcResponse.txHash}</Text>
              </>
            }
            type="success"
            showIcon
          />
        }
      </div>


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
            !sending && !rpcResponse && <Button icon={<LockOutlined />} onClick={() => {
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
            sending && !rpcResponse && <Button loading disabled type="primary" style={{ float: "right" }}>
              发送中....
            </Button>
          }
          {
            rpcResponse && <Button onClick={close} type="primary" style={{ float: "right" }}>
              关闭
            </Button>
          }
        </Col>
      </Row>
    </div>
  </>

}
