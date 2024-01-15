import { useDispatch, useSelector } from "react-redux";
import { useWeb3Hooks } from "../../connectors/hooks"
import { useBlockNumber } from "../application/hooks";
import { AppDispatch, AppState } from "..";
import { useEffect } from "react";
import { checkedTransaction, finalizeTransaction, loadTransactionsAndUpdateAddressActivityFetch } from "./actions";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { Activity2Transaction, TransactionDetails, TransactionsCombine, TransactionState } from "./reducer";
import { fetchAddressActivity } from "../../services/address";
import { IPC_CHANNEL } from "../../config";
import { DBAddressActivitySignal, DB_AddressActivity_Methods } from "../../../main/handlers/DBAddressActivitySingalHandler";

export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number, status?: number }
): boolean {
  if (tx.receipt) return false
  if (tx.status != undefined) return false
  if (!tx.lastCheckedBlockNumber) return true
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    return true
  }
}

export default () => {

  const { useProvider, useChainId } = useWeb3Hooks();
  const provider = useProvider();
  const chainId = useChainId;
  const latestBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)
  const transactions = state ? state.transactions : {};
  const activeAccount = useWalletsActiveAccount();
  const addressActivityFetch = state.addressActivityFetch;

  useEffect(() => {
    if (addressActivityFetch && addressActivityFetch?.address == activeAccount) {
      if (addressActivityFetch.status == 1) {
        console.log(`Finish fetch Address[${addressActivityFetch.address}]`)
        return;
      }
      console.log(`Exeucte fetch Address[${addressActivityFetch.address}] activities from
                   Block[${addressActivityFetch.blockNumberStart}] to Block[${addressActivityFetch.blockNumberEnd}]`);
      fetchAddressActivity(addressActivityFetch)
        .then(data => {
          const { total, current, pageSize, totalPages } = data;
          const addressActivities = data.records;
          if (data.records.length > 0) {
            const newFetch = {
              ...addressActivityFetch,
            }
            if (current < totalPages) {
              newFetch.current = newFetch.current + 1;
            } else {
              if (newFetch.blockNumberStart == 1) {
                newFetch.status = 1;
              } else {
                newFetch.blockNumberStart = 1;
                newFetch.blockNumberEnd = newFetch.dbStoredRange.start;
                newFetch.current = 1;
              }
            }
            window.electron.ipcRenderer.sendMessage(IPC_CHANNEL,
              [DBAddressActivitySignal, DB_AddressActivity_Methods.saveOrUpdateActivities,
              [addressActivities]
            ]);
            setTimeout(() => {
              dispatch( loadTransactionsAndUpdateAddressActivityFetch ({
                addTxns:  data.records.map( Activity2Transaction ),
                addressActivityFetch: newFetch
              }));
            }, 3000);
          }
        })
    }
  }, [activeAccount, addressActivityFetch]);


  useEffect(() => {
    if (!chainId || !provider || !latestBlockNumber) return
    Object.keys(transactions)
      .filter(hash => shouldCheck(latestBlockNumber, transactions[hash]))
      .forEach(hash => {
        provider
          .getTransactionReceipt(hash)
          .then(receipt => {
            if (receipt) {
              dispatch(
                finalizeTransaction({
                  hash,
                  receipt: {
                    blockHash: receipt.blockHash,
                    blockNumber: receipt.blockNumber,
                    contractAddress: receipt.contractAddress,
                    from: receipt.from,
                    status: receipt.status,
                    to: receipt.to,
                    transactionHash: receipt.transactionHash,
                    transactionIndex: receipt.transactionIndex,
                  }
                })
              )
            } else {
              dispatch(checkedTransaction({ hash, blockNumber: latestBlockNumber }))
            }
          })
      });
  }, [provider, transactions, latestBlockNumber, activeAccount]);

  useEffect(() => {
    if (activeAccount && latestBlockNumber > 0) {
      setTimeout(() => {
        fetchAddressActivity({
          address: activeAccount,
          blockNumberStart: latestBlockNumber - 10,
          blockNumberEnd: latestBlockNumber,
          current: 1,
          pageSize: 500
        }).then(data => {
          console.log(`query the latest activies for :${activeAccount}, from Block:[${latestBlockNumber-10}] to Block:[${latestBlockNumber}],result:`, data.records);
          if (data.records.length > 0) {
            dispatch(loadTransactionsAndUpdateAddressActivityFetch({
              addTxns: data.records.map(Activity2Transaction),
            }));
          }
        })
      }, 3000);

    }
  }, [activeAccount, latestBlockNumber]);


  return (<></>)
}
