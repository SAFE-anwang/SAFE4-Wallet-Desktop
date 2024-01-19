import { useCallback, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useSafe4Balance, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import { ethers } from "ethers";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import { AccountRecord } from "../../../../structs/AccountManager";
const { Text, Link } = Typography;


export default ({
  accountRecord
}: {
  accountRecord?: AccountRecord
}) => {

  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const [sending, setSending] = useState<boolean>(false);
  const [showErrorDetail, setShowErrorDetail] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<{
    txHash: string | null,
    error: any | null
  }>();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];

  const doWithdrawTransaction = useCallback(() => {
    if (activeAccount && accountManaggerContract) {
      if (accountRecord) {
        accountManaggerContract.withdrawByID([accountRecord.id])
          .then((response: any) => {
            setSending(false);
            const { hash, data } = response;
            setRpcResponse({
              txHash: hash,
              error: null
            });
            addTransaction({ to: accountManaggerContract.address }, response, {
              call: {
                from: activeAccount,
                to: accountManaggerContract.address,
                input: data,
                value: "0"
              }
            });
          }).catch((err: any) => {
            setSending(false);
            setRpcResponse({
              txHash: null,
              error: err
            });
          })
      } else {

      }
    }
  }, [activeAccount, accountManaggerContract]);

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

      {
        !accountRecord && <>
          <Row >
            <Col span={24}>
              <Text style={{ fontSize: "32px" }} strong>{safe4balance?.avaiable?.amount?.toFixed(6)} SAFE</Text>
            </Col>
          </Row>
          <br />
          <Row >
            <Col span={24}>
              <Text strong>从</Text>
              <br />
              <Text style={{ marginLeft: "10px", fontSize: "18px" }}>锁仓账户</Text>
            </Col>
          </Row>
          <br />
          <Row >
            <Col span={24}>
              <Text strong>到</Text>
              <br />
              <Text style={{ marginLeft: "10px", fontSize: "18px" }}>普通账户</Text>
            </Col>
          </Row>
        </>
      }
      {
        accountRecord && <>
          <Row >
            <Col span={24}>
              <Text style={{ fontSize: "32px" }} strong>{accountRecord.amount.toFixed(6)} SAFE</Text>
            </Col>
          </Row>
          <br />
          <Row >
            <Col span={24}>
              <Text strong>从</Text>
              <br />
              <Text style={{ marginLeft: "10px", fontSize: "18px" }}>锁仓账户:[ID={accountRecord.id}]</Text>
            </Col>
          </Row>
          <br />
          <Row >
            <Col span={24}>
              <Text strong>到</Text>
              <br />
              <Text style={{ marginLeft: "10px", fontSize: "18px" }}>普通账户</Text>
            </Col>
          </Row>
        </>
      }

      <Divider />

      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !rpcResponse && <Button onClick={() => {
              doWithdrawTransaction()
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              执行
            </Button>
          }
          {
            sending && !rpcResponse && <Button loading disabled type="primary" style={{ float: "right" }}>
              广播交易..
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
