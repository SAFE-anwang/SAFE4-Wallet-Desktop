
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import CallProposalCreate from "./CallProposalCreate";
import { CurrencyAmount } from "@uniswap/sdk";


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
  } = transaction;
  const { from, title, value , payAmount } = useMemo(() => {
    return {
      from: transaction.refFrom,
      title: support.inputDecodeResult._title,
      payAmount : CurrencyAmount.ether(support.inputDecodeResult._payAmount).toFixed(2),
      value: call?.value,
      input: call?.input,
    }
  }, [transaction, call,support]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <CallProposalCreate title={title} payAmount={payAmount} value={value ?? "0"} status={status}  />
        </>
      }
    </List.Item>
  </>

}
