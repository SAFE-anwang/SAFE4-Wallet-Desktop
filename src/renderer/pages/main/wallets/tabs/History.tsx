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

const { Text } = Typography;

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const transactions = useTransactions(activeAccount);
  const [clickTransaction, setClickTransaction] = useState<TransactionDetails>();
  const dispatch = useDispatch();

  useEffect(() => {
    if (activeAccount) {
      const method = "loadTransactions";
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBSignal, method, [activeAccount]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBSignal && arg[1] == method) {
          const rows = arg[2][0];
          const transactions : TransactionState = {};
          for(let i in rows){
            console.log(rows[i]);
            const {transaction_hash,ref_from,ref_to,action,data,added_time,timestamp,status} = rows[i];
            const _data = JSON.parse(data);
            transactions[transaction_hash] = {
              hash : transaction_hash,
              refFrom : ref_from,
              refTo : ref_to,
              addedTime : added_time,
              timestamp,
              status,
              transfer : action == "Transfer" ? { from : ref_from , to:ref_to , value : _data.value } : undefined ,
            };
          }
          dispatch( reloadTransactions(transactions) );
        }
      });

      fetchAddressActivity( {
        address : activeAccount ,
        blockNumberStart : 1,
        blockNumberEnd : 999999,
        current : 1,
        pageSize : 500
      } ).then( data => {
        console.log(data)
      }).catch( err => {
        console.log("fetch address activities : " ,err)
      })

    }
  }, [activeAccount]);



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
