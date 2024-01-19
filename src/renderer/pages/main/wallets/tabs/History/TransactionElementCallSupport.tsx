import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementCallAMDeposit from "./TransactionElementCallAMDeposit";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const {
    call
  } = transaction;
  return <>
    <TransactionElementCallAMDeposit transaction={transaction} setClickTransaction={setClickTransaction} support={support}  />
  </>
}
