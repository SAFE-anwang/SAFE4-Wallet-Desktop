
import { useMemo, useState } from "react";
import TransactionElementTransfer from "./TransactionElementTransfer";
import TransactionElementCall from "./TransactionElementCall";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementSystemReward from "./TransactionElementSystemReward";
import TransactionElementInternalTransfer from "./TransactionElementInternalTransfer";
import TransactionElements from "./TransactionElements";
import { Typography } from "antd";

const { Text } = Typography;

export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const activeAccount = useWalletsActiveAccount();
  const ElementRender = useMemo(() => {
    const {
      transfer, call, systemRewardDatas, accountManagerDatas, internalTransfers, tokenTransfers
    } = transaction;
    if (transfer) {
      return <>
        <TransactionElementTransfer transaction={transaction} setClickTransaction={setClickTransaction} />
      </>
    }
    if (call) {
      return <>
        <TransactionElementCall transaction={transaction} setClickTransaction={setClickTransaction} />
      </>
    }
    if (systemRewardDatas) {
      return <>
        <TransactionElementSystemReward transaction={transaction} setClickTransaction={setClickTransaction} />
      </>
    }
    if (!call && (accountManagerDatas || internalTransfers || tokenTransfers)) {
      return <>
        {
          <TransactionElements transaction={transaction} setClickTransaction={setClickTransaction} />
        }
      </>
    }
    return <>
      {/* <Text>
        {JSON.stringify(transaction)}
      </Text> */}
    </>
  }, [activeAccount, transaction])

  return <>
    {ElementRender}
  </>
}
