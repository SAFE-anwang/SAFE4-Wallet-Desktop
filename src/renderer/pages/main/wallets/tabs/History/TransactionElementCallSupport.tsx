import React, { useCallback, useMemo } from "react";
import { SupportAccountManagerFunctions } from "../../../../../constants/DecodeSupportFunction";
import { SystemContract } from "../../../../../constants/SystemContracts";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementCallAMDeposit from "./TransactionElementCallAMDeposit";
import TransactionElementCallAMWithdraw from "./TransactionElementCallAMWithdraw";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const SelectCallRender = useCallback(() => {
    const to = transaction.call?.to;
    switch (to) {
      case SystemContract.AccountManager:
        return CallAccountManagerFuncRender(support.supportFuncName, transaction, setClickTransaction, support)
      default:
        return <></>
    }
    return <></>
  }, [transaction, setClickTransaction, support]);

  const CallAccountManagerFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportAccountManagerFunctions.Deposit:
        return <TransactionElementCallAMDeposit
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportAccountManagerFunctions.WithdrawByID:
        return <TransactionElementCallAMWithdraw
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportAccountManagerFunctions.Withdraw:
        return <TransactionElementCallAMWithdraw
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      default:
        return <></>
    }
  }

  return <>{SelectCallRender()}</>
}
