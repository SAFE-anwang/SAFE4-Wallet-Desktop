import { createAction } from "@reduxjs/toolkit";
import { AddressActivityFetch, ContractCall, SerializableTransactionReceipt, TransactionDetails, Transfer } from "./reducer";

export const addTransaction = createAction<{
  hash: string
  refFrom: string,
  refTo?: string,
  // 自定义数据 ...
  approval?: { tokenAddress: string; spender: string }
  summary?: string
  transfer?: Transfer
  call ?: ContractCall
}>('transactions/addTransaction')

export const clearAllTransactions = createAction<"">('transactions/clearAllTransactions')

export const reloadTransactionsAndSetAddressActivityFetch = createAction<{
  txns: TransactionDetails[],
  addressActivityFetch: AddressActivityFetch
}>("transactions/reloadTransactionsAndSetAddressActivityFetch");

export const loadTransactionsAndUpdateAddressActivityFetch = createAction<{
  addTxns: TransactionDetails[],
  addressActivityFetch ?: AddressActivityFetch
}>("transactions/loadTransactionsAndUpdateAddressActivityFetch");

export const finalizeTransaction = createAction<{
  hash: string,
  receipt: SerializableTransactionReceipt
}>('transactions/finalizeTransaction')

export const checkedTransaction = createAction<{
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
