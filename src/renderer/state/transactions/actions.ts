import { createAction } from "@reduxjs/toolkit";
import { AddressActivityFetch, ContractCall, SerializableTransactionReceipt, TokenTransfer, TransactionDetails, Transfer } from "./reducer";
import { CrossChainVO, DateTimeNodeRewardVO, TimeNodeRewardVO } from "../../services";

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
  chainId : number,
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
}>("transactions/refreshAddressTimeNodeReward");

export const loadERC20Tokens = createAction<{
  [address : string] : {
    name : string,
    symbol : string ,
    decimals : number ,
    chainId : number
  }
}>("transactions/loadERC20Tokens");

export const updateERC20Token = createAction<{
  chainId : number, address : string,
  name : string , symbol : string,
  decimals : number
}>("transactions/updateERC20Token")

export const updateCrosschains = createAction<CrossChainVO[]>("transactions/updateCrosschains")
