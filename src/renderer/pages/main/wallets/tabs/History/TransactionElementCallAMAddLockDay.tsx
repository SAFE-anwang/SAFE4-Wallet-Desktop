
import { Col, Row, Avatar, List, Typography, Modal, Button, Divider } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementTemplate from "./TransactionElementTemplate";
import { ApartmentOutlined, ClockCircleOutlined, ClusterOutlined, LockOutlined } from "@ant-design/icons";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
}) => {
  const {
    status,
    call,
  } = transaction;
  const { value, lockId, addLockDay } = useMemo(() => {
    return {
      value: call?.value,
      lockId: support.inputDecodeResult._id,
      addLockDay: support.inputDecodeResult._day
    }
  }, [transaction, call, support]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <TransactionElementTemplate
            icon={<ClockCircleOutlined style={{ color: "black" }} />}
            title={"追加锁仓天数"}
            status={status}
            description={<>
              <Text type="secondary">
                锁仓ID:<Text type="secondary" strong> {lockId} </Text>
                <Divider type="vertical" />
                追加锁仓天数:<Text type="secondary" strong> {addLockDay} </Text>天
              </Text>
            </>}
            assetFlow={<>
              <Text type="secondary" strong>
                {value && EtherAmount({ raw: value, fix: 18 })} SAFE
              </Text>
            </>}
          />
        </>
      }
    </List.Item>
  </>

}
