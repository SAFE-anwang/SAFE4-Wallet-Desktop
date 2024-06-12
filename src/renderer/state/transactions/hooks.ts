import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback, useMemo } from "react";
import { addTransaction } from "./actions";
import { Transfer, TransactionDetails, ContractCall } from "./reducer";
import { DateFormat } from "../../utils/DateUtils";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { TimeNodeRewardVO } from "../../services";

export function useTransactionAdder2(): (
  response: {
    from: string,
    to: string,
    hash: string,
    chainId: number,
  },
  customData?: {
    transfer?: Transfer,
    call?: ContractCall,
    withdrawAmount?: string
  }
) => void {
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    (
      response: {
        from: string,
        to: string,
        hash: string,
        chainId: number
      },
      { transfer, call, withdrawAmount }:
        {
          transfer?: Transfer,
          call?: ContractCall,
          withdrawAmount?: string
        } = {}
    ) => {
      const { from, hash, chainId } = response;
      const { to } = transfer ? { ...transfer } :
        call ? { ...call }
          : { to: undefined };
      const transaction = {
        hash,
        chainId,
        refFrom: from,
        refTo: to,
        transfer,
        call,
        withdrawAmount
      }
      dispatch(addTransaction(transaction));
    },
    [dispatch]
  )
}

export function useTransactionAdder(): (
  request: TransactionRequest,
  response: TransactionResponse,
  customData?: {
    transfer?: Transfer,
    call?: ContractCall,
    withdrawAmount?: string
  }
) => void {
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    (
      request: TransactionRequest,
      response: TransactionResponse,
      { transfer, call, withdrawAmount }:
        {
          transfer?: Transfer,
          call?: ContractCall,
          withdrawAmount?: string
        } = {}
    ) => {
      const { from, hash } = response;
      const { to } = transfer ? { ...transfer } :
        call ? { ...call }
          : { to: undefined };
      const transaction = {
        hash,
        refFrom: from,
        chainId: response.chainId,
        refTo: to,
        transfer,
        call,
        withdrawAmount
      }
      dispatch(addTransaction(transaction));
    },
    [dispatch]
  )
}

export function useTransactions(account?: string) {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  const nodeRewards = useSelector((state: AppState) => state.transactions.nodeRewards);
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
    [date: string]: {
      transactions: TransactionDetails[],
      systemRewardAmount: CurrencyAmount
    }
  } = {};

  accountTransactions.forEach(transaction => {
    const date = transaction.timestamp ? transaction.timestamp : transaction.addedTime;
    const dateKey = DateFormat(date);
    dateTransactions[dateKey] = dateTransactions[dateKey] ?? {
      transactions: [],
      systemRewardAmount: CurrencyAmount.ether(JSBI.BigInt(0))
    };
    if (transaction.systemRewardDatas) {
      Object.keys(transaction.systemRewardDatas)
        .forEach(eventLogIndex => {
          if (transaction.systemRewardDatas) {
            const { amount } = transaction.systemRewardDatas[eventLogIndex];
            const _amount = CurrencyAmount.ether(JSBI.BigInt(amount));
            dateTransactions[dateKey].systemRewardAmount = dateTransactions[dateKey].systemRewardAmount.add(_amount);
          }
        })
    } else {
      dateTransactions[dateKey].transactions.push(transaction);
    }
  });
  if (nodeRewards && account && nodeRewards[account]) {
      nodeRewards[account].forEach((nodeReward: TimeNodeRewardVO) => {
        const { rewardAmount, time } = nodeReward;
        const dateKey = time.split(" ")[0];
        const amount = CurrencyAmount.ether(JSBI.BigInt(rewardAmount));
        if (!dateTransactions[dateKey]) {
          dateTransactions[dateKey] = {
            transactions: [],
            systemRewardAmount: CurrencyAmount.ether(JSBI.BigInt(0))
          };
        }
        dateTransactions[dateKey].systemRewardAmount = amount;
      })

  }
  return dateTransactions;
}

export function useTransaction(hash: string): TransactionDetails {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  return transactions[hash];
}
