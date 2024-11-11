import { createReducer } from "@reduxjs/toolkit"
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction, loadERC20Tokens, loadTransactionsAndUpdateAddressActivityFetch, refreshAddressTimeNodeReward, reloadTransactionsAndSetAddressActivityFetch, updateERC20Token } from "./actions"
import { IPC_CHANNEL } from "../../config"
import { DBAddressActivitySignal, DB_AddressActivity_Actions, DB_AddressActivity_Methods } from "../../../main/handlers/DBAddressActivitySingalHandler"
import { DateTimeNodeRewardVO, TimeNodeRewardVO } from "../../services"
import { ethers } from "ethers"
import { ERC20Tokens_Methods, ERC20TokensSignal } from "../../../main/handlers/ERC20TokenSignalHandler"

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
  data?: any,
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
  },
  withdrawAmount?: string,
  internalTransfers?: {
    [eventLogIndex: string]: {
      from: string,
      to: string,
      value: string
    }
  },
  tokenTransfers?: {
    [eventLogIndex: string]: TokenTransfer
  },

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
  type?: string,
  tokenTransfer?: TokenTransfer,
  action?: string,
}

export interface Transfer {
  from: string,
  to: string,
  value: string
}

export interface TokenTransfer {
  from: string,
  to: string,
  token: {
    address: string,
    name: string,
    symbol: string,
    decimals: number
  },
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
  },
  chainId: number,
}

export interface TransactionState {
  [txHash: string]: TransactionDetails,
}

export const initialState: {
  transactions: TransactionState,
  addressActivityFetch?: AddressActivityFetch,
  nodeRewards?: {
    [address: string]: DateTimeNodeRewardVO[]
  },
  tokens: {
    [address: string]: {
      name: string,
      symbol: string,
      decimals: number,
      chainId: number,
    }
  },
  chainId?: number
} = {
  transactions: {},
  tokens: {},
  chainId: -1
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

    .addCase(reloadTransactionsAndSetAddressActivityFetch, ({ transactions, tokens }, { payload: { txns, addressActivityFetch } }) => {
      transactions = TransactionsCombine(undefined, txns);
      return {
        transactions: transactions,
        tokens,
        addressActivityFetch: {
          ...addressActivityFetch
        },
        chainId: addressActivityFetch.chainId
      }
    })

    .addCase(loadTransactionsAndUpdateAddressActivityFetch, (state, { payload: { chainId, addTxns, addressActivityFetch } }) => {
      if (state.chainId != chainId) {
        console.log("chainid changed.....")
        return;
      }
      if (addTxns && addTxns.length > 0) {
        state.transactions = TransactionsCombine(state.transactions, addTxns);
        // 当有新的交易数据进来同步的时候,对数据进行一次过滤,如果数据中存在 TokenTransfer ,
        // 则尝试更新该 Token 信息到 Erc20_Tokens 表中;
        const tokens: {
          [address: string]: {
            decimals: number,
            name: string,
            symbol: string,
            chainId: number
          }
        } = {};
        addTxns.forEach(txn => {
          if (txn.action && txn.action == "TokenTransfer") {
            const token = txn.data.token;
            const { address, decimals, name, symbol } = token;
            const checksumedAddress = ethers.utils.getAddress(address);
            if (state.tokens[checksumedAddress]) {
              if (decimals != state.tokens[checksumedAddress].decimals ||
                name != state.tokens[checksumedAddress].name ||
                symbol != state.tokens[checksumedAddress].symbol
              ) {
                tokens[checksumedAddress] = {
                  decimals, name, symbol, chainId
                }
              }
            } else {
              tokens[checksumedAddress] = {
                decimals, name, symbol, chainId
              }
            }
          }
        });
        Object.keys(tokens).forEach(address => {
          if (address && tokens[address]) {
            const { name, symbol, decimals } = tokens[address];
            window.electron.ipcRenderer.sendMessage(
              IPC_CHANNEL, [ERC20TokensSignal, ERC20Tokens_Methods.save, [{
                chainId, address, name, symbol, decimals
              }]]
            );
            state.tokens[address] = {
              name, symbol, decimals, chainId
            }
          }
        });

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

    .addCase(clearAllTransactions, (state, { payload }) => {
      if (!state.transactions) return
      state.transactions = {}
    })

    .addCase(loadERC20Tokens, (state, { payload }) => {
      state.tokens = payload;
    })

    .addCase(updateERC20Token, (state, { payload }) => {
      const { chainId, address, name, symbol, decimals } = payload;
      state.tokens[address] = {
        name, symbol, decimals, chainId
      }
    })

})

export function Transaction2Activity(txn: TransactionDetails) {
  const { chainId, hash, refFrom, refTo, addedTime, transfer, call } = txn;
  const { action, data } =
    call ? {
      action: call.type ? call.type : DB_AddressActivity_Actions.Call,
      data: JSON.stringify(call)
    }
      : {
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
    case DB_AddressActivity_Actions.TokenTransfer:
      return {
        ...transaction,
        tokenTransfers: {
          [transaction.eventLogIndex]: {
            ...transaction.data,
            action: transaction.action,
            eventLogIndex: transaction.eventLogIndex
          }
        }
      }
    case DB_AddressActivity_Actions.Call:
      return {
        ...transaction,
        call: { ...transaction.data }
      }
    case DB_AddressActivity_Actions.Create:
      return {
        ...transaction,
        call: { ...transaction.data, action: transaction.action }
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
    case DB_AddressActivity_Actions.InternalTransfer:
      return {
        ...transaction,
        internalTransfers: {
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
        if (tx.internalTransfers) {
          const _internalTransferDatas = txns[tx.hash].internalTransfers ? { ...txns[tx.hash].internalTransfers } : {};
          Object.keys(tx.internalTransfers).forEach((eventLogIndex) => {
            if (tx.internalTransfers) {
              _internalTransferDatas[eventLogIndex] = tx.internalTransfers[eventLogIndex]
            }
          });
          txns[tx.hash].internalTransfers = _internalTransferDatas;
        }
        if (tx.tokenTransfers) {
          const _tokenTransferDatas = txns[tx.hash].tokenTransfers ? { ...txns[tx.hash].tokenTransfers } : {};
          Object.keys(tx.tokenTransfers).forEach((eventLogIndex) => {
            if (tx.tokenTransfers) {
              _tokenTransferDatas[eventLogIndex] = tx.tokenTransfers[eventLogIndex]
            }
          });
          txns[tx.hash].tokenTransfers = _tokenTransferDatas;
        }
      }
    });
  }
  return txns;
}

