import { createReducer } from "@reduxjs/toolkit"
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction, loadTransactionsAndUpdateAddressActivityFetch, refreshAddressTimeNodeReward, reloadTransactionsAndSetAddressActivityFetch } from "./actions"
import { IPC_CHANNEL } from "../../config"
import { DBAddressActivitySignal, DB_AddressActivity_Actions, DB_AddressActivity_Methods } from "../../../main/handlers/DBAddressActivitySingalHandler"
import { TimeNodeRewardVO } from "../../services"

const now = () => new Date().getTime()

export interface SerializableTransactionReceipt {
  chainId: number,
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
  chainId?: number,
  hash: string,
  refFrom: string,
  refTo?: string,
  blockNumber?: number,
  timestamp?: number,
  status?: number,
  action?: string,
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
  transfer?: Transfer,
  call?: ContractCall,
  accountManagerDatas?: {
    [eventLogIndex: string]: AccountManagerData
  },
  systemRewardDatas?: {
    [eventLogIndex: string]: SystemRewardData
  }
  withdrawAmount?: string,
}

export interface SystemRewardData {
  action: string,
  eventLogIndex: number,
  from: string,
  to: string,
  type: number,
  amount: string
}

export interface AccountManagerData {
  action: string,
  eventLogIndex: number
  from?: string,
  to?: string,
  amount?: string,
  id?: string,
  lockDay?: string
}

export interface ContractCall {
  from: string,
  to: string,
  input: string,
  value: string,
  type?: string
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
  address: string,
  blockNumberStart: number,
  blockNumberEnd: number,
  current: number,
  pageSize: number,
  status: number,
  dbStoredRange: {
    start: number,
    end: number
  }
}

export interface TransactionState {
  [txHash: string]: TransactionDetails,
}

export const initialState: {
  transactions: TransactionState,
  addressActivityFetch?: AddressActivityFetch,

  nodeRewards?: {
    [address: string]: TimeNodeRewardVO[]
  }

} = {
  transactions: {},
}

export default createReducer(initialState, (builder) => {

  builder
    .addCase(addTransaction, ({ transactions }, { payload: { hash, refFrom, refTo, transfer, call, withdrawAmount, chainId } }) => {
      if (transactions[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions ?? {};
      txs[hash] = {
        hash, refFrom, refTo,
        addedTime: now(),
        transfer, call, withdrawAmount,
        action: call?.type,
        chainId
      }
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL,
        [DBAddressActivitySignal, DB_AddressActivity_Methods.saveActivity,
          [Transaction2Activity(txs[hash])]
        ]
      );
      transactions = txs
    })



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
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL,
        [DBAddressActivitySignal, DB_AddressActivity_Methods.updateActivity,
          [receipt]
        ]
      );
    })

    .addCase(reloadTransactionsAndSetAddressActivityFetch, ({ transactions }, { payload: { txns, addressActivityFetch } }) => {
      transactions = TransactionsCombine(undefined, txns);
      return {
        transactions: transactions,
        addressActivityFetch: {
          ...addressActivityFetch
        }
      }
    })

    .addCase(loadTransactionsAndUpdateAddressActivityFetch, (state, { payload: { addTxns, addressActivityFetch } }) => {
      if (addTxns && addTxns.length > 0) {
        state.transactions = TransactionsCombine(state.transactions, addTxns);
      }
      const nextFetch = addressActivityFetch ?? undefined;
      if (nextFetch && state.addressActivityFetch?.address == nextFetch.address) {
        state.addressActivityFetch = nextFetch;
      }
    })

    .addCase(refreshAddressTimeNodeReward, (state, { payload: { chainId, address, nodeRewards } }) => {
      if (!state.nodeRewards) {
        state.nodeRewards = {};
      }
      state.nodeRewards[address] = nodeRewards;
    })

    .addCase(clearAllTransactions, ( state , { payload }) => {
      if (!state.transactions) return
      state.transactions = {}
    })

})

export function Transaction2Activity(txn: TransactionDetails) {
  const { chainId, hash, refFrom, refTo, addedTime, transfer, call } = txn;
  const { action, data } = call ? {
    action: call.type ? call.type : DB_AddressActivity_Actions.Call,
    data: JSON.stringify(call)
  } : {
    action: DB_AddressActivity_Actions.Transfer,
    data: JSON.stringify(transfer)
  }
  return {
    hash,
    chainId,
    refFrom,
    refTo,
    addedTime,
    action,
    data
  }
}

export function Activity2Transaction(row: any): TransactionDetails {
  const transaction
    = row.transaction_hash ? {
      hash: row.transaction_hash,
      refFrom: row.ref_from,
      refTo: row.ref_to,
      action: row.action,
      data: JSON.parse(row.data),
      addedTime: row.added_time ? row.added_time : row.timestamp,
      timestamp: row.timestamp,
      status: row.status,
      blockNumber: row.block_number,
      eventLogIndex: row.event_log_index
    } : {
      hash: row.transactionHash,
      refFrom: row.refFrom,
      refTo: row.refTo,
      action: row.action,
      data: row.data,
      addedTime: row.timestamp,
      timestamp: row.timestamp,
      status: row.status,
      blockNumber: row.blockNumber,
      eventLogIndex: row.eventLogIndex
    };

  switch (transaction.action) {
    case DB_AddressActivity_Actions.Transfer:
      return {
        ...transaction,
        transfer: { ...transaction.data }
      }
    case DB_AddressActivity_Actions.Call:
      return {
        ...transaction,
        call: { ...transaction.data }
      }
    case DB_AddressActivity_Actions.Create:
      return {
        ...transaction,
        call: { ...transaction.data }
      }
    case DB_AddressActivity_Actions.AM_Deposit:
      return {
        ...transaction,
        accountManagerDatas: {
          [transaction.eventLogIndex]: {
            ...transaction.data,
            action: transaction.action,
            eventLogIndex: transaction.eventLogIndex
          }
        }
      }
    case DB_AddressActivity_Actions.AM_Withdraw:
      return {
        ...transaction,
        accountManagerDatas: {
          [transaction.eventLogIndex]: {
            ...transaction.data,
            action: transaction.action,
            eventLogIndex: transaction.eventLogIndex
          }
        }
      }
    case DB_AddressActivity_Actions.AM_Transfer:
      return {
        ...transaction,
        accountManagerDatas: {
          [transaction.eventLogIndex]: {
            ...transaction.data,
            action: transaction.action,
            eventLogIndex: transaction.eventLogIndex
          }
        }
      }
    case DB_AddressActivity_Actions.SystemReward:
      const _transaction =
      {
        ...transaction,
        systemRewardDatas: {
          [transaction.eventLogIndex]: {
            ...transaction.data,
            action: transaction.action,
            eventLogIndex: transaction.eventLogIndex
          }
        }
      }
      return _transaction;
    default:
      return {
        ...transaction,
      }
  }
}

export function TransactionsCombine(transactions: TransactionState | undefined, addTxns: TransactionDetails[]): TransactionState {
  const txns = transactions ?? {};
  if (addTxns) {
    addTxns.forEach(tx => {
      if (!txns[tx.hash]) {
        txns[tx.hash] = tx;
      } else {
        if (tx.transfer) {
          txns[tx.hash] = tx;
        }
        if (tx.call) {
          txns[tx.hash].call = tx.call;
        }
        if (tx.accountManagerDatas) {
          const _accountManagerDatas = txns[tx.hash].accountManagerDatas ? { ...txns[tx.hash].accountManagerDatas } : {};
          Object.keys(tx.accountManagerDatas).forEach((eventLogIndex) => {
            if (tx.accountManagerDatas) {
              _accountManagerDatas[eventLogIndex] = tx.accountManagerDatas[eventLogIndex]
            }
          });
          txns[tx.hash].accountManagerDatas = _accountManagerDatas;
        }
        if (tx.systemRewardDatas) {
          const _systemRewardDatas = txns[tx.hash].systemRewardDatas ? { ...txns[tx.hash].systemRewardDatas } : {};
          Object.keys(tx.systemRewardDatas).forEach((eventLogIndex) => {
            if (tx.systemRewardDatas) {
              _systemRewardDatas[eventLogIndex] = tx.systemRewardDatas[eventLogIndex]
            }
          });
          txns[tx.hash].systemRewardDatas = _systemRewardDatas;
        }
      }
    });
  }
  return txns;
}

