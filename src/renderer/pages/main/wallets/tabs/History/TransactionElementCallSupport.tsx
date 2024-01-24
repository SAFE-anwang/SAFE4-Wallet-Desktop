import React, { useCallback, useMemo } from "react";
import { SupportAccountManagerFunctions, SupportSupernodeLogicFunctions, SupportSupernodeVoteFunctions } from "../../../../../constants/DecodeSupportFunction";
import { SystemContract } from "../../../../../constants/SystemContracts";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementCallAMDeposit from "./TransactionElementCallAMDeposit";
import TransactionElementCallAMWithdraw from "./TransactionElementCallAMWithdraw";
import TransactionElementCallSNRegister from "./TransactionElementCallSNRegister";
import TransactionElementCallSNAppend from "./TransactionElementCallSNAppend";
import TransactionElementCallSNVote from "./TransactionElementCallSNVote";

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
      case SystemContract.SuperNodeLogic:
        return CallSupernodeLogicFuncRender(support.supportFuncName, transaction, setClickTransaction, support)
      case SystemContract.SNVote:
        return CallSupernodeVoteFuncRender(support.supportFuncName, transaction, setClickTransaction, support)
      default:
        return <></>
    }
    return <></>
  }, [transaction, setClickTransaction, support]);

  const CallSupernodeVoteFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportSupernodeVoteFunctions.VoteOrApproval:
        return <TransactionElementCallSNVote
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      default:
        return <></>
    }
  }

  const CallSupernodeLogicFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportSupernodeLogicFunctions.Register:
        return <TransactionElementCallSNRegister
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportSupernodeLogicFunctions.AppendRegister:
        return <TransactionElementCallSNAppend
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      default:
        return <></>
    }
  }

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
