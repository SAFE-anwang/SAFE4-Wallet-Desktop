import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback, useMemo } from "react";
import { addTransaction } from "./actions";
import { Transfer, TransactionDetails, ContractCall } from "./reducer";
import { DateFormat } from "../../utils/DateUtils";

export function useTransactionAdder(): (
  request: TransactionRequest,
  response: TransactionResponse,
  customData?: { 
    summary?: string; 
    approval?: { tokenAddress: string; spender: string }; 
    transfer?: Transfer , 
    call ?: ContractCall
  }
) => void {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    (
      request: TransactionRequest,
      response: TransactionResponse,
      { summary, approval, transfer , call }:
        {
          summary?: string;
          approval?: { tokenAddress: string; spender: string },
          transfer?: Transfer ,
          call ?: ContractCall,
        } = {}
    ) => {
      // 先做如果是 tranfer 的情况.
      const { hash } = response;
      if (transfer) {
        const { from, to } = transfer;
        const transaction = {
          hash, refFrom: from, refTo: to,
          transfer
        }
        dispatch(addTransaction(transaction))
      }else if (call){
        const { from , to , value , input } = call;
        const transaction = {
          hash, refFrom:from,refTo:to , 
          call
        }
        dispatch(addTransaction(transaction))
      }
    },
    [dispatch]
  )
}

export function useTransactions(account?: string) {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  const accountTransactions = useMemo(() => {
    return Object.keys(transactions)
      .filter(txHash => {
        const transaction = transactions[txHash];
        const { refFrom, refTo } = transaction;
        return refFrom == account || refTo == account;
      })
      .map(txHash => {
        return transactions[txHash];
      })
      .sort((t0, t1) => {
        return t1.addedTime - t0.addedTime
      })
  }, [account, transactions]);
  const dateTransactions: {
    [date: string]: TransactionDetails[]
  } = {};
  accountTransactions.forEach(transaction => {
    const date = transaction.timestamp ? transaction.timestamp : transaction.addedTime;
    const dateKey = DateFormat(date);
    dateTransactions[dateKey] = dateTransactions[dateKey] ?? [];
    dateTransactions[dateKey].push(transaction)
  });
  return dateTransactions;
}

export function useTransaction(hash: string): TransactionDetails {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  return transactions[hash];
}
