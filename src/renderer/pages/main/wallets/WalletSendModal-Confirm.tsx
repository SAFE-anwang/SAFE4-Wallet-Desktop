
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks"
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useBlockNumber } from "../../../state/application/hooks";
import { ethers } from "ethers";
import WalletSendModalInput from "./WalletSendModal-Input";
import { SearchOutlined, SendOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useTransactionAdder } from "../../../state/transactions/hooks";

const { Text, Link } = Typography;

export default ({
  to, amount , close
}: {
  to: string,
  amount: string,
  close : () => void
}) => {

  const signer = useWalletsActiveSigner();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const [sending, setSending] = useState<boolean>(false);
  const [showErrorDetail, setShowErrorDetail] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<{
    txHash: string | null,
    error: any | null
  }>();

  const doSendTransaction = function (signer: ethers.Signer, tx: any) {
    setSending(true);
    signer.sendTransaction(tx).then( response => {
      setSending(false);
      const {
        hash
      } = response;
      setRpcResponse({
        txHash: hash,
        error: null
      })
      addTransaction( tx , response, {
        transfer : {
          from :  activeAccount,
          to : tx.to,
          value : tx.value.toString()
        }
      });
    }).catch(error => {
      setSending(false);
      setRpcResponse({
        txHash: null,
        error: error
      });
    })
  };

  return (<>
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

      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{amount} SAFE</Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>从</Text>
          <br />
          <Text style={{ marginLeft: "10px", fontSize: "18px" }}>{signer?.address}</Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>到</Text>
          <br />
          <Text style={{ marginLeft: "10px", fontSize: "18px" }}>{to}</Text>
        </Col>
      </Row>
      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !rpcResponse && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction(signer, {
                to,
                value: ethers.utils.parseEther(amount)
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
  </>)

}
