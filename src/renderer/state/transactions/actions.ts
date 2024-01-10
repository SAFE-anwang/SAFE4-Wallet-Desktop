import { createAction } from "@reduxjs/toolkit";
import { SerializableTransactionReceipt, TransactionState, Transfer } from "./reducer";


export const addTransaction = createAction<{

  hash: string
  refFrom: string,
  refTo ?: string,

  approval?: {tokenAddress: string; spender: string}
  summary?: string
  transfer? : Transfer

}>('transactions/addTransaction')

export const clearAllTransactions = createAction<"">('transactions/clearAllTransactions')

export const reloadTransactions = createAction<TransactionState>("transactions/reloadTransactions");

export const finalizeTransaction = createAction<{
  hash: string,
  receipt: SerializableTransactionReceipt
}>('transactions/finalizeTransaction')

export const checkedTransaction = createAction<{
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
