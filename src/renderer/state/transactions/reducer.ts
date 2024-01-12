import { createReducer } from "@reduxjs/toolkit"
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction, loadFetchActivities, reloadTransactions } from "./actions"
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
  hash: string,
  refFrom: string,
  refTo?: string,
  blockNumber?: number,
  timestamp?: number,
  status?: number,
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

export interface AddressActivityFetch {
  address : string,
  blockNumberStart: number,
  blockNumberEnd: number,
  current: number,
  pageSize: number,
  status: number,
  dbStoredRange : {
    start : number,
    end : number
  }
}

export interface TransactionState {
  [txHash: string]: TransactionDetails,
}

export const initialState: {
  transactions: TransactionState,
  addressActivityFetch ?: AddressActivityFetch
} = {
  transactions: {},
}

export default createReducer(initialState, (builder) => {

  builder
    .addCase(addTransaction, ({ transactions }, { payload: { hash, refFrom, refTo, approval, summary, transfer } }) => {
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

    // .addCase(clearAllTransactions, (transactions, { payload }) => {
    //   if (!transactions) return
    //   transactions = {}
    // })

    .addCase(checkedTransaction, ({ transactions }, { payload: { hash, blockNumber } }) => {
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

    .addCase(finalizeTransaction, ({ transactions }, { payload: { hash, receipt } }) => {
      const tx = transactions[hash]
      if (!tx) {
        return
      }
      tx.receipt = receipt;
      tx.status = receipt.status;
      tx.confirmedTime = now();
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, 'updateTransaction', [receipt]]);
    })

    .addCase(reloadTransactions, ({ transactions }, { payload }) => {
      transactions = {
        ...payload.transactions
      }
      return {
        transactions,
        addressActivityFetch : {
          ...payload.addressActivityFetch
        }
      }
    })

    .addCase(loadFetchActivities, ( state , { payload }) => {
      const addTxns = payload.transactions;
      const nextFetch = payload.addressActivityFetch ?? undefined;
      const txs = state.transactions ?? {};

      if ( addTxns ){
        Object.keys(addTxns).forEach( hash => {
          txs[hash] = addTxns[hash];
        })
        state.transactions = txs;
      }
      if ( nextFetch && state.addressActivityFetch?.address  == nextFetch.address ){
        state.addressActivityFetch = nextFetch;
      }

    })

})
