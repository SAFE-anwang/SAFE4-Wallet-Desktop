import { useDispatch, useSelector } from "react-redux";
import { useWeb3Hooks } from "../../connectors/hooks"
import { useBlockNumber } from "../application/hooks";
import { AppDispatch, AppState } from "..";
import { useEffect } from "react";
import { checkedTransaction, finalizeTransaction } from "./actions";

export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number , status?:number }
): boolean {
  if (tx.receipt) return false
  console.log("should check tx >> ?? " , tx.status )
  if (tx.status != undefined ) return false
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
  const transactions = state ? state : {};

  useEffect(() => {
    if (!chainId || !provider || !latestBlockNumber) return
    Object.keys(transactions)
      .filter(hash => shouldCheck(latestBlockNumber, transactions[hash]))
      .forEach(hash => {
        // 查询交易入块对应的时间.
        provider
          .getTransactionReceipt(hash)
          .then(receipt => {
            console.log("do get transaction receipt >>" , hash)
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
      })
  }, [provider, transactions, latestBlockNumber]);

  return (<></>)
}
