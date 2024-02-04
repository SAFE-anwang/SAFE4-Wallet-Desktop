
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import CallProposalVote from "./CallProposalVote";


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
  const { proposoalId , voteResult } = useMemo(() => {
    return {
      proposoalId : support.inputDecodeResult._id.toNumber(),
      voteResult : support.inputDecodeResult._voteResult.toNumber(),
    }
  }, [transaction, call,support]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          {/* [as call] */}
          <CallProposalVote proposalId={proposoalId} voteResult={voteResult} status={status}  />
        </>
      }
    </List.Item>
  </>

}
