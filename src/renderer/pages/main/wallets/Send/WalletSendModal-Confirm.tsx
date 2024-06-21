
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { LockOutlined, SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import AddressView from "../../../components/AddressView";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useAccountManagerContract } from "../../../../hooks/useContracts";

const { Text } = Typography;

export default ({
  to, amount, lockDay,
  setTxHash, close
}: {
  to: string,
  amount: string,
  lockDay: number | undefined,
  setTxHash: (txHash: string) => void
  close: () => void,
}) => {

  const signer = useWalletsActiveSigner();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const doLockTransfer = useMemo(() => {
    return lockDay && lockDay > 0;
  }, [lockDay])

  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const doSendTransaction = useCallback(({ to, amount, lockDay }: { to: string, amount: string, lockDay: number | undefined }) => {
    if (signer && accountManaggerContract) {
      const value = ethers.utils.parseEther(amount);
      if (lockDay && lockDay > 0) {
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
      } else {
        const tx = {
          to,
          value,
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
    }
  }, [signer, accountManaggerContract]);

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
      {
        doLockTransfer &&
        <Row >
          <Col span={24}>
            <Text strong>锁仓天数</Text>
            <br />
            <Text style={{ fontSize: "18px" }}>
              {lockDay}
            </Text>
          </Col>
        </Row>
      }
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction({ to, amount, lockDay });
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
  </>)

}
