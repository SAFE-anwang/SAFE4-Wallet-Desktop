
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    accountManagerDatas, withdrawAmount
  } = transaction;
  const { from, to, value, input } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: transaction.refFrom,
      value: call?.value,
      input: call?.input
    }
  }, [transaction, call, accountManagerDatas]);

  const [withdrawAmountInDatas,setWithdrawAmountInDatas] = useState<string | undefined>("0");

  useEffect(() => {
    if (accountManagerDatas) {
      Object.keys(accountManagerDatas)
        .forEach(key => {
          if (accountManagerDatas[key].action == "AccountManager:SafeWithdraw") {
            console.log("accountManagerDatas[key].amount :", accountManagerDatas[key].amount)
            if ( accountManagerDatas[key].amount ){
              setWithdrawAmountInDatas(accountManagerDatas[key].amount);
            }
          }
        })
    }
  }, [accountManagerDatas])

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && accountManagerDatas && <>
          {/* <span style={{ width: "100px" }}>
             {JSON.stringify(accountManagerDatas["2"])}
          </span> */}
          <AccountManagerSafeWithdraw from={from} to={to} value={withdrawAmountInDatas} status={status} />
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
