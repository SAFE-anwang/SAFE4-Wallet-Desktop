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
  hash: string
  approval?: { tokenAddress: string; spender: string }
  summary?: string
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string,
  transfer ?: TokenTransfer
}

export interface TokenTransfer {
  from : string ,
  to : string,
  token ?: string,
  value : string
}


export interface TransactionState {
  [txHash: string]: TransactionDetails
}

export const initialState: TransactionState = {}

export default createReducer(initialState, (builder) => {

  builder
    .addCase(addTransaction, (transactions, { payload: { from, hash, approval, summary, transfer } }) => {
      if (transactions[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions ?? {};
      txs[hash] = { hash, approval, summary, transfer , from, addedTime: now() }
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

    .addCase(finalizeTransaction, (transactions, { payload: { hash, receipt } }) => {
      const tx = transactions[hash]
      if (!tx) {
        return
      }
      tx.receipt = receipt
      tx.confirmedTime = now()
    })

})
