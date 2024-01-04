import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback, useMemo } from "react";
import { addTransaction } from "./actions";
import { useWeb3Hooks } from "../../connectors/hooks";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { TokenTransfer, TransactionDetails } from "./reducer";
import { DateFormat, DateTimeFormat } from "../../utils/DateUtils";


export function useTransactionAdder(): (
  request: TransactionRequest,
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string } ; transfer ?: TokenTransfer }
) => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(
    (
      request: TransactionRequest,
      response: TransactionResponse,
      { summary, approval , transfer }:
        {
          summary?: string;
          approval?: { tokenAddress: string; spender: string } ,
          transfer ?: TokenTransfer
        } = {}
    ) => {
      const { hash , from } = response;
      const { to , value } = request;
      if (!hash || !to ) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({
        hash, from, to , value : value ? value.toString() : "0",
        approval, summary , transfer
      }))
    },
    [dispatch]
  )
}

export function useTransactions( account ?: string ){
  const transactions = useSelector((state : AppState) => state.transactions);
  const accountTransactions = useMemo( () => {
    return Object.keys( transactions )
    .filter( txHash => {
      const transaction = transactions[txHash];
      const { from , to } = transaction;
      return from == account || to == account;
    })
    .map( txHash => {
      return transactions[txHash];
    })
    .sort( (t0,t1) => {
      return t1.addedTime - t0.addedTime
    })
  } , [account,transactions] );



  const dateTransactions : {
    [ date : string ] : TransactionDetails[]
  } = {};
  accountTransactions.forEach( transaction => {
    const date = transaction.timestamp ? transaction.timestamp : transaction.addedTime;
    const dateKey = DateFormat(date);
    dateTransactions[dateKey] = dateTransactions[dateKey] ?? [];
    dateTransactions[dateKey].push(transaction)
  });
  console.log("txsgroup ==>" , dateTransactions)
  return dateTransactions;
}
