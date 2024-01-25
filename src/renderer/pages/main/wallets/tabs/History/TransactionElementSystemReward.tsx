import { List, Row, Typography } from "antd";
import { TransactionDetails } from "../../../../../state/transactions/reducer"
import TransactionElementTemplate from "./TransactionElementTemplate"
import TransactionElement from "./TransactionElement";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";

const { Text } = Typography;

export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {
  const { systemRewardDatas } = transaction;
  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      <Row style={{ width: "100%" }}>
        {
          systemRewardDatas && Object
            .keys(systemRewardDatas)
            .map(eventLogIndex => {
              const systemReward = systemRewardDatas[eventLogIndex];
              return <span style={{ width: "100%" }}>
                <TransactionElementTemplate title="挖矿奖励" description={systemReward.from} status={1} assetFlow={
                  <>
                    <Text type="success">
                      + {CurrencyAmount.ether(JSBI.BigInt(systemReward.amount)).toFixed(6)} SAFE
                    </Text>
                  </>}
                />
              </span>
            })
        }
      </Row>
    </List.Item>
  </>
}
