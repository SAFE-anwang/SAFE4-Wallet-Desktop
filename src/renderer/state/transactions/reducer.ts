import { createReducer } from "@reduxjs/toolkit"
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction, reloadTransactions } from "./actions"
import { IPC_CHANNEL } from "../../config"
import { DBSignal } from "../../../main/handlers/DBSignalHandler"

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
  hash    : string,
  refFrom : string,
  refTo  ?: string,
  timestamp ?: number,
  status ?: number,
  /** 交易的receipt */
  receipt?: SerializableTransactionReceipt,
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
  transfer?: Transfer
}

export interface Transfer {
  from: string,
  to: string,
  value: string
}

export interface ERC20Transfer {
  from: string,
  to: string,
  token: string,
  value: string
}

export interface TransactionState {
  [txHash: string]: TransactionDetails
}

export const initialState: TransactionState = {}

export default createReducer(initialState, (builder) => {

  builder
    .addCase(addTransaction, (transactions, { payload: { hash, refFrom, refTo, approval, summary, transfer } }) => {
      if (transactions[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions ?? {};
      txs[hash] = {
        hash, refFrom, refTo,
        addedTime: now(),
        approval, summary, transfer
      }
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, 'saveTransaction', [txs[hash]]]);
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
      tx.receipt = receipt;
      tx.status = receipt.status;
      tx.confirmedTime = now();
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, 'updateTransaction', [ receipt ]]);
    })

    .addCase(reloadTransactions , ( transactions , { payload } ) => {
      return {
        ...payload
      }
    })

})
