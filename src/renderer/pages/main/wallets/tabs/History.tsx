import { Col, Row, Avatar, List, Typography, Modal, Button, Divider } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import "./index.css"
import TransactionElement from "./TransactionElement";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TransactionDetails, TransactionState } from "../../../../state/transactions/reducer";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import TransactionDetailsView from "./TransactionDetailsView";
import { IPC_CHANNEL } from "../../../../config";
import { DBSignal } from "../../../../../main/handlers/DBSignalHandler";
import { useDispatch } from "react-redux";
import { reloadTransactions } from "../../../../state/transactions/actions";
import { fetchAddressActivity } from "../../../../services/address";
import { useBlockNumber } from "../../../../state/application/hooks";
import { toChecksumAddress } from "ethereumjs-util";
import ChecksumAddress from "../../../../utils/ChecksumAddress";

const { Text } = Typography;

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const transactions = useTransactions(activeAccount);
  const [clickTransaction, setClickTransaction] = useState<TransactionDetails>();
  const dispatch = useDispatch();
  const latestBlockNumber = useBlockNumber();

  useEffect( () => {
    if (activeAccount) {
      const method = "loadTransactions";
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, method, [activeAccount]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBSignal && arg[1] == method) {
          const rows = arg[2][0];
          const transactions: TransactionState = {};
          let blockNumberStart = 1;
          for (let i in rows) {
            const { transaction_hash, ref_from, ref_to, action, data, added_time, timestamp, status , block_number } = rows[i];
            const _data = JSON.parse(data);
            transactions[transaction_hash] = {
              hash: transaction_hash,
              refFrom: ref_from,
              refTo: ref_to,
              addedTime: added_time ? added_time : timestamp,
              timestamp,
              status,
              blockNumber : block_number,
              transfer: action == "Transfer" ? { from: ref_from, to: ref_to, value: _data.value } : undefined,
            };
            if ( timestamp ){
              blockNumberStart = Math.max(blockNumberStart , block_number);
            }
          }
          console.log(`fetch Address[${activeAccount}] Activities,from BlockNumber:${blockNumberStart}`)
          fetchAddressActivity({
            address : activeAccount,
            blockNumberStart: 1,
            blockNumberEnd: latestBlockNumber,
            current : 1,
            pageSize : 1
          }).then( data => {
            const { total , current , pageSize } = data;
            const addressActivities = data.records;
            console.log(addressActivities)
            for(let i in addressActivities){
              const {
                transactionHash , eventLogIndex , blockNumber , refFrom , refTo, timestamp , action , data , status
              } = addressActivities[i];
              if ( transactions[transactionHash] ){
                transactions[transactionHash].timestamp = timestamp;
              }else{
                transactions[transactionHash] = {
                  hash : transactionHash,
                  status ,
                  refFrom,
                  refTo ,
                  timestamp,
                  addedTime:timestamp,
                  blockNumber : blockNumber,
                  transfer : action == "Transfer" ? data : undefined
                }
              }
            }
            if ( current * pageSize < total ){
              console.log("has next page")
            }
            window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, "saveOrUpdateTransactions", [addressActivities]]);
            dispatch(reloadTransactions(transactions));
          })
        }
      });
    }
  }, [activeAccount])

  return <>

    <Modal title="交易明细" closable footer={null} open={clickTransaction != null} onCancel={() => setClickTransaction(undefined)}>
      <Divider />
      {clickTransaction && <TransactionDetailsView transaction={clickTransaction} />}
    </Modal>
    {
      Object.keys(transactions)
        .map(date => {
          return (<div key={date}>
            <Text type="secondary">{date}</Text>
            <br />
            <List
              style={{
                marginTop: "5px", marginBottom: "5px"
              }}
              bordered
              itemLayout="horizontal"
              dataSource={transactions[date]}
              renderItem={(item, index) => (
                <TransactionElement setClickTransaction={setClickTransaction} transaction={item} />
              )}
            />
          </div>)
        })
    }

  </>

}
