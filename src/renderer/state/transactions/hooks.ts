import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback, useMemo } from "react";
import { addTransaction } from "./actions";
import { useWeb3Hooks } from "../../connectors/hooks";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { TokenTransfer, TransactionDetails } from "./reducer";
import { DateFormat, DateTimeFormat } from "../../utils/DateUtils";
import { IPC_CHANNEL } from "../../config";
import { DBSignal } from "../../../main/handlers/DBSignalHandler";


export function useTransactionAdder(): (
  request: TransactionRequest,
  response: TransactionResponse,
  customData?: { summary?: string; approval?: { tokenAddress: string; spender: string } ; transfer ?: TokenTransfer }
) => void {
  const dispatch = useDispatch<AppDispatch>();
 
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
      const transaction = {
        hash, from, to , value : value ? value.toString() : "0",
        approval, summary , transfer
      };
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ DBSignal, 'saveTransaction', [transaction] ]);
      dispatch(addTransaction(transaction))
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
  return dateTransactions;
}

export function useTransaction( hash : string) : TransactionDetails {
  const transactions = useSelector((state : AppState) => state.transactions);
  return transactions[hash];
}
