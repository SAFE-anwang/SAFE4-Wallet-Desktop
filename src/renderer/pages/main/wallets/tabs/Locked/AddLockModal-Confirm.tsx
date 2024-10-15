import { Alert, Button, Col, Divider, Input, Row, Typography } from "antd"
import { AccountRecord } from "../../../../../structs/AccountManager"
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { DateTimeFormat } from "../../../../../utils/DateUtils";
import { LockOutlined } from "@ant-design/icons";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";
import { useAccountManagerContract } from "../../../../../hooks/useContracts";
import { useCallback, useState } from "react";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";

const { Text } = Typography;

export default ({
  selectedAccountRecord,
  addLockDay,
  close,
  setTxHash
}: {
  selectedAccountRecord: AccountRecord,
  addLockDay: number,
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {

  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const [sending, setSending] = useState<boolean>(false);
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();

  const {
    id, amount, unlockHeight
  } = selectedAccountRecord;
  const locked = unlockHeight > blockNumber;
  const unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;

  const doAddLockDay = useCallback((id: number, addLockDay: number) => {
    if (accountManaggerContract) {
      setSending(true);
      accountManaggerContract.addLockDay(id, addLockDay)
        .then((response: any) => {
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: accountManaggerContract.address }, response, {
            call: {
              from: activeAccount,
              to: accountManaggerContract.address,
              input: data,
              value: "0"
            }
          });
          setTxHash(hash);
          setSending(false);
        })
        .catch((err: any) => {
          setSending(false);
          setErr(err)
        });
    }
  }, [accountManaggerContract, activeAccount])

  return <>
    <Row>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      {
        render
      }
      <Col span={24}>
        <Text type="secondary">锁仓ID</Text>
        <br />
        <Text strong>
          {
            locked && <LockOutlined />
          }
          {id}
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">锁仓数量</Text>
        <br />
        <Text strong>{amount.toFixed(2)} SAFE</Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">解锁高度</Text>
        <br />
        <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
        {
          unlockDateTime && <Text strong style={{ float: "right" }} type="secondary">[{unlockDateTime}]</Text>
        }
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Text type="secondary" strong>追加锁仓天数</Text>
        <br />
        <Text strong>{addLockDay} 天</Text>
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Row style={{ width: "100%", textAlign: "right" }}>
          <Col span={24}>
            {
              !sending && !render && <Button onClick={() => {
                doAddLockDay(selectedAccountRecord.id, addLockDay)
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
      </Col>
    </Row>
  </>

}
