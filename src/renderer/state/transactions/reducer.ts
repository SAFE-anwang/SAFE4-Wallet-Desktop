import { createReducer } from "@reduxjs/toolkit"
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction } from "./actions"

const now = () => new Date().getTime()

export interface SerializableTransactionReceipt {
  from: string
  to: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

export interface TransactionDetails {
  hash: string,
  from: string,
  to: string,
  value: string,

  timestamp?: number,
  /** 交易的receipt */
  receipt?: SerializableTransactionReceipt

  /**
   * 自动更新的一些控制参数
   */
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  /**
   * 自定义携带数据 ...
   */
  approval?: { tokenAddress: string; spender: string }
  summary?: string
  transfer?: TokenTransfer
}

export interface TokenTransfer {
  from: string,
  to: string,
  token?: string,
  value: string
}

export interface TransactionState {
  [txHash: string]: TransactionDetails
}

export const initialState: TransactionState = {}

export default createReducer(initialState, (builder) => {

  builder
    .addCase(addTransaction, (transactions, { payload: { hash, from, to, value, approval, summary, transfer } }) => {
      if (transactions[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions ?? {};
      txs[hash] = {
        hash, from, to, value,
        addedTime: now(),
        approval, summary, transfer
      }
      transactions = txs
    })

    .addCase(clearAllTransactions, (transactions, { payload }) => {
      if (!transactions) return
      transactions = {}
    })

    .addCase(checkedTransaction, (transactions, { payload: { hash, blockNumber } }) => {
      const tx = transactions[hash]
      if (!tx) {
        return
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    })

    .addCase(finalizeTransaction, (transactions, { payload: { hash, timestamp , receipt } }) => {
      const tx = transactions[hash]
      if (!tx) {
        return
      }
      tx.timestamp = timestamp;
      tx.receipt = receipt;
      tx.confirmedTime = now();
    })

})
