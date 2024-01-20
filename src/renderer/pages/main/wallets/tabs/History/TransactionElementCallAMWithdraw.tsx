
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import AccountManagerSafeWithdraw from "./AccountManagerSafeWithdraw";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const {
    status,
    call,
    accountManagerDatas,withdrawAmount
  } = transaction;
  const { from, to, value, input } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: transaction.refFrom,
      value: call?.value,
      input: call?.input
    }
  }, [transaction, call, accountManagerDatas]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && accountManagerDatas && <>
          {/* <span style={{ width: "100px" }}>
            {JSON.stringify(accountManagerDatas)}
          </span> */}
          <AccountManagerSafeWithdraw from={from} to={to} value={accountManagerDatas[0].amount} status={status} />
        </>
      }
      {
        call && !accountManagerDatas && <>
           {/* [as call] */}
          <AccountManagerSafeWithdraw from={from} to={to} value={withdrawAmount} status={status} />
        </>
      }
    </List.Item>
  </>

}
