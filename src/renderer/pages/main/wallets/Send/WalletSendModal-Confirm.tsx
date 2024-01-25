
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import AddressView from "../../../components/AddressView";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";

const { Text } = Typography;

export default ({
  to, amount,
  setTxHash,close
}: {
  to: string,
  amount: string,
  setTxHash : (txHash : string) => void
  close: () => void , 
}) => {

  const signer = useWalletsActiveSigner();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();

  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const doSendTransaction = useCallback(({ to, amount }: { to: string, amount: string }) => {
    if (signer) {
      const value = ethers.utils.parseEther(amount);
      const tx = {
        to,
        value
      }
      setSending(true);
      signer.sendTransaction(tx).then(response => {
        setSending(false);
        const {
          hash
        } = response;
        setTxHash(hash);
        setTransactionResponse(response);
        addTransaction(tx, response, {
          transfer: {
            from: activeAccount,
            to: tx.to,
            value: tx.value.toString()
          }
        });
      }).catch(err => {
        setSending(false);
        setErr(err)
      })
    }
  }, [signer]);

  return (<>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
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
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={activeAccount} />
          </Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>到</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={to} />
          </Text>
        </Col>
      </Row>
      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction({ to, amount });
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              执行
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
  </>)

}
