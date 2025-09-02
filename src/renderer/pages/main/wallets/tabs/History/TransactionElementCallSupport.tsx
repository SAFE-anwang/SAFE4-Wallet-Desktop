import React, { useCallback, useMemo } from "react";
import { SupportSafe3Functions, SupportAccountManagerFunctions, SupportMasternodeLogicFunctions, SupportProposalFunctions, SupportSupernodeLogicFunctions, SupportSupernodeVoteFunctions, isCrosschainPoolTransaction, SupportSafeswapV2RouterFunctions } from "../../../../../constants/DecodeSupportFunction";
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
import TransactionElementCallSNChange from "./TransactionElementCallSNChange";
import TransactionElementCallMNChange from "./TransactionElementCallMNChange";
import TransactionElementCallAMAddLockDay from "./TransactionElementCallAMAddLockDay";
import { useTranslation } from "react-i18next";
import { Application_Crosschain, Application_Crosschain_Pool_BSC, Safe4NetworkChainId, SafeswapV2RouterAddress } from "../../../../../config";
import TransactionElementCallCrosschainPool from "./TransactionElementCallCrosschainPool";
import TransactionElementCallCrosschain from "./TransactionElementCallCrosschain";
import TransactionElementCallSafeswapV2Router from "./TransactionElementCallSafeswapV2Router";
import TransactionElementCallSafeswapV2RouterLiquidity from "./TransactionElementCallSafeswapV2RouterLiquidity";
import TransactionElementCallSafeswapV2RouterLiquidityRemove from "./TransactionElementCallSafeswapV2RouterLiquidityRemove";
import { BatchLockContract, BatchLockLevel } from "../../../../../constants/BatchLockContract";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {

  const { t } = useTranslation();

  const SelectCallRender = useCallback(() => {
    const to = transaction.call?.to;
    const from = transaction.call?.from;
    switch (to) {
      case BatchLockContract[Safe4NetworkChainId.Mainnet][BatchLockLevel.TEN_CENTS]:
      case BatchLockContract[Safe4NetworkChainId.Mainnet][BatchLockLevel.ONE_CENT]:
      case BatchLockContract[Safe4NetworkChainId.Testnet][BatchLockLevel.TEN_CENTS]:
      case BatchLockContract[Safe4NetworkChainId.Testnet][BatchLockLevel.ONE_CENT]:
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
      case Application_Crosschain[Safe4NetworkChainId.Testnet] || Application_Crosschain[Safe4NetworkChainId.Mainnet]:
        return CallCrosschainFunsRender(support.supportFuncName, transaction, setClickTransaction, support);
      case SafeswapV2RouterAddress:
        return CallSafeswapV2RouterRender(support.supportFuncName, transaction, setClickTransaction, support);
      default:
        if (isCrosschainPoolTransaction(to, from)) {
          return CallCrosschainPoolFunsRender(support.supportFuncName, transaction, setClickTransaction, support);
        }
        return <>No support Contract-Function-Render</>
    }
    return <></>
  }, [transaction, setClickTransaction, support]);

  const CallSafeswapV2RouterRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    switch (funcName) {
      case SupportSafeswapV2RouterFunctions.SwapExactETHForTokens:
      case SupportSafeswapV2RouterFunctions.SwapETHForExactTokens:

      case SupportSafeswapV2RouterFunctions.SwapExactTokensForETH:
      case SupportSafeswapV2RouterFunctions.SwapTokensForExactETH:

      case SupportSafeswapV2RouterFunctions.SwapExactTokensForTokens:
      case SupportSafeswapV2RouterFunctions.SwapTokensForExactTokens:

        return <TransactionElementCallSafeswapV2Router
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />

      case SupportSafeswapV2RouterFunctions.AddLiquidityETH:
      case SupportSafeswapV2RouterFunctions.AddLiquidity:
        return <TransactionElementCallSafeswapV2RouterLiquidity
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />

      case SupportSafeswapV2RouterFunctions.RemoveLiquidityETHWithPermit:
      case SupportSafeswapV2RouterFunctions.RemoveLiquidityWithPermit:
        return <TransactionElementCallSafeswapV2RouterLiquidityRemove
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />

      default:
        return <></>
    }
  }

  const CallCrosschainFunsRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    return <TransactionElementCallCrosschain
      transaction={transaction}
      setClickTransaction={setClickTransaction}
      support={support}
    />
  }

  const CallCrosschainPoolFunsRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {
    return <TransactionElementCallCrosschainPool
      transaction={transaction}
      setClickTransaction={setClickTransaction}
      support={support}
    />
  }

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

    let title;

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
      case SupportSupernodeLogicFunctions.ChangeName:
        title = t("wallet_history_sn_update_name");
        break;
      case SupportSupernodeLogicFunctions.ChangeAddress:
        title = t("wallet_history_sn_update_address");
        break;
      case SupportSupernodeLogicFunctions.ChangeDescription:
        title = t("wallet_history_sn_update_description");
        break;
      case SupportSupernodeLogicFunctions.ChangeEncode:
        title = t("wallet_history_sn_update_enode");
        break;
      case SupportSupernodeLogicFunctions.ChangeNameByID:
        title = t("wallet_history_sn_update_name");
        break;
      case SupportSupernodeLogicFunctions.ChangeDescriptionByID:
        title = t("wallet_history_sn_update_description");
        break;
      case SupportSupernodeLogicFunctions.ChangeEncodeByID:
        title = t("wallet_history_sn_update_enode");
        break;
      case SupportSupernodeLogicFunctions.ChangeIncentivePlan:
        title = t("wallet_history_sn_update_incentiveplan");
        break;
      default:
        return <></>
    }
    if (title) {
      return <TransactionElementCallSNChange
        transaction={transaction}
        setClickTransaction={setClickTransaction}
        support={support}
        title={title}
      />
    }
  }

  const CallMasternodeLogicFuncRender = (funcName: string, transaction: TransactionDetails, setClickTransaction: (transaction: TransactionDetails) => void, support: any) => {

    let title = undefined;

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
      case SupportMasternodeLogicFunctions.ChangeAddress:
        return <TransactionElementCallMNChange
          title={t("wallet_history_mn_update_address")}
          transaction={transaction}
          setClickTransaction={setClickTransaction}
          support={support}
        />
      case SupportMasternodeLogicFunctions.ChangeEncode:
        title = t("wallet_history_mn_update_enode");
        break;
      case SupportMasternodeLogicFunctions.ChangeDescription:
        title = t("wallet_history_mn_update_description");
        break;
      case SupportMasternodeLogicFunctions.ChangeEncodeByID:
        title = t("wallet_history_mn_update_enode");
        break;
      case SupportMasternodeLogicFunctions.ChangeDescriptionByID:
        title = t("wallet_history_mn_update_description");
        break;
      default:
        return <></>
    }
    if (title) {
      return <TransactionElementCallMNChange
        title={title}
        transaction={transaction}
        setClickTransaction={setClickTransaction}
        support={support}
      />
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
      case SupportAccountManagerFunctions.AddLockDay:
        return <TransactionElementCallAMAddLockDay
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
