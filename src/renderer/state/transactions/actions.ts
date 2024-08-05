import { createAction } from "@reduxjs/toolkit";
import { AddressActivityFetch, ContractCall, SerializableTransactionReceipt, TokenTransfer, TransactionDetails, Transfer } from "./reducer";
import { DateTimeNodeRewardVO, TimeNodeRewardVO } from "../../services";

export const addTransaction = createAction<{
  hash: string
  refFrom: string,
  refTo?: string,
  chainId ?: number,
  // 自定义数据 ...
  transfer?: Transfer,
  tokenTransfer ?: TokenTransfer,
  call ?: ContractCall,
  withdrawAmount ?: string,
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
}>('transactions/checkedTransaction');

export const refreshAddressTimeNodeReward = createAction<{
  chainId : number ,
  address : string ,
  nodeRewards : DateTimeNodeRewardVO[]
}>("transactions/refreshAddressTimeNodeReward")
