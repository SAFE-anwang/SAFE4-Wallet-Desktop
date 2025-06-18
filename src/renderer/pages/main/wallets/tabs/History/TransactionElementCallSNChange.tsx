
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementTemplate from "./TransactionElementTemplate";
import { ClusterOutlined } from "@ant-design/icons";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({ transaction, setClickTransaction, support, title }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
  title: string
}) => {
  const {
    status,
    call,
  } = transaction;
  const { addr, value , id } = useMemo(() => {
    return {
      from: transaction.refFrom,
      addr: support.inputDecodeResult._addr,
      id: support.inputDecodeResult._id,
      value: call?.value,
    }
  }, [transaction, call, support]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <TransactionElementTemplate
            icon={<ClusterOutlined style={{ color: "black" }} />}
            title={title}
            status={status}
            description={addr ? addr : "超级节点ID:" + id }
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
