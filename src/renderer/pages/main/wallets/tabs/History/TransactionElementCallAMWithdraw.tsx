
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { DB_AddressActivity_Actions } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
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
    accountManagerDatas
  } = transaction;
  const { from, to, value, input } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: transaction.refFrom,
      value: call?.value,
      input: call?.input
    }
  }, [transaction, call]);

  return <>
    { JSON.stringify(accountManagerDatas) }
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      
      {
        call && accountManagerDatas &&
          accountManagerDatas.filter( accountManagerData => accountManagerData.action == DB_AddressActivity_Actions.AM_Withdraw )
            .map( accountManagerData => {
              return <AccountManagerSafeWithdraw from={from} to={to} value={accountManagerData.amount} status={1} />
            })
      }
      {
        call && !accountManagerDatas && <AccountManagerSafeWithdraw from={from} to={to} value={undefined} status={status} />
      }
    </List.Item>
  </>

}
