import React, { useCallback, useMemo } from "react";
import { SupportSafe3Functions, SupportAccountManagerFunctions, SupportMasternodeLogicFunctions, SupportProposalFunctions, SupportSupernodeLogicFunctions, SupportSupernodeVoteFunctions } from "../../../../../constants/DecodeSupportFunction";
import { SystemContract } from "../../../../../constants/SystemContracts";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementCallAMDeposit from "./TransactionElementCallAMDeposit";
import TransactionElementCallAMWithdraw from "./TransactionElementCallAMWithdraw";
import TransactionElementCallSNRegister from "./TransactionElementCallSNRegister";
import TransactionElementCallSNAppend from "./TransactionElementCallSNAppend";
import TransactionElementCallSNVote from "./TransactionElementCallSNVote";
import TransactionElementCallMNRegister from "./TransactionElementCallMNRegister";
import TransactionElementCallMNAppend from "./TransactionElementCallMNAppend";
import TransactionElementCallProposalVote from "./TransactionElementCallProposalVote";
import TransactionElementCallProposalCreate from "./TransactionElementCallProposalCreate";
import TransactionElementCallSafe3Redeem from "./TransactionElementCallSafe3Redeem";
import TransactionELementCallAMBatchDeposit from "./TransactionElementCallAMBatchDeposit"

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
      case SystemContract.MasterNodeLogic:
        return CallMasternodeLogicFuncRender(support.supportFuncName, transaction, setClickTransaction, support)
      case SystemContract.Proposal:
        return CallProposalFunsRender(support.supportFuncName, transaction, setClickTransaction, support)
      case SystemContract.SAFE3:
        return CallSafe3FunsRender(support.supportFuncName, transaction, setClickTransaction, support)
      default:
        return <>No support Contract-Function-Render</>
    }
    return <></>
  }, [transaction, setClickTransaction, support]);

  const CallProposalFunsRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportProposalFunctions.Create:
        return <TransactionElementCallProposalCreate
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportProposalFunctions.Vote:
        return <TransactionElementCallProposalVote
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      default:
        return <></>
    }
  }

  const CallSafe3FunsRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportSafe3Functions.BatchRedeemAvailable:
      case SupportSafe3Functions.BatchRedeemLocked:
      case SupportSafe3Functions.BatchRedeemMasterNode:
        return <TransactionElementCallSafe3Redeem
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      default:
        return <></>
    }
  }

  const CallSupernodeVoteFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportSupernodeVoteFunctions.VoteOrApproval:
        return <TransactionElementCallSNVote
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportSupernodeVoteFunctions.VoteOrApprovalWithAmount:
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

  const CallMasternodeLogicFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportMasternodeLogicFunctions.Register:
        return <TransactionElementCallMNRegister
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportMasternodeLogicFunctions.AppendRegister:
        return <TransactionElementCallMNAppend
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
      case SupportAccountManagerFunctions.BatchDeposit4One:
        return <TransactionELementCallAMBatchDeposit
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
