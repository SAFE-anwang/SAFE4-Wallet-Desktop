import { createAction } from "@reduxjs/toolkit";
import { AddressActivityFetch, SerializableTransactionReceipt, TransactionState, Transfer } from "./reducer";


export const addTransaction = createAction<{

  hash: string
  refFrom: string,
  refTo?: string,

  approval?: { tokenAddress: string; spender: string }
  summary?: string
  transfer?: Transfer

}>('transactions/addTransaction')

export const clearAllTransactions = createAction<"">('transactions/clearAllTransactions')

export const reloadTransactions = createAction<{
  transactions: TransactionState,
  addressActivityFetch: AddressActivityFetch
}>("transactions/reloadTransactions");

export const loadFetchActivities = createAction<{
  transactions: TransactionState,
  addressActivityFetch ?: AddressActivityFetch
}>("transactions/loadFetchActivities");

export const updateFetchs = createAction<{
  address: string,
  blockNumberStart: number,
  blockNumberEnd: number,
  current: number,
  pageSize: number
}>("transactions/updateFetchs")

export const finalizeTransaction = createAction<{
  hash: string,
  receipt: SerializableTransactionReceipt
}>('transactions/finalizeTransaction')

export const checkedTransaction = createAction<{
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
