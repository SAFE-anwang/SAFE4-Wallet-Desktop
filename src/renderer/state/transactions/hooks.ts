import { TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback } from "react";
import { addTransaction } from "./actions";
import { useWeb3Hooks } from "../../connectors/hooks";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { TokenTransfer } from "./reducer";


export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string } ; transfer ?: TokenTransfer }
) => void {
  const account = useWalletsActiveAccount();
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (
      response: TransactionResponse,
      { summary, approval , transfer }:
        {
          summary?: string;
          approval?: { tokenAddress: string; spender: string } ,
          transfer ?: TokenTransfer
        } = {}
    ) => {
      if (!account) return
      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      console.log("dispatch transfer :" , transfer);
      dispatch(addTransaction({ hash, from: account, approval, summary , transfer }))
    },
    [dispatch, account]
  )
}

export function useTransactions(){
  return useSelector((state: AppState) => {
    return state.transactions;
  })
}
