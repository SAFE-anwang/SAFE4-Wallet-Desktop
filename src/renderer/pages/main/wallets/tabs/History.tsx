import { Col, Row, Avatar, List, Typography, Modal, Button, Divider } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import "./index.css"
import TransactionElement from "./TransactionElement";
import { useEffect, useState } from "react";
import { Activity2Transaction, TransactionDetails, TransactionsCombine, TransactionState } from "../../../../state/transactions/reducer";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import TransactionDetailsView from "./TransactionDetailsView";
import { IPC_CHANNEL } from "../../../../config";
import { DBAddressActivitySignal, DB_AddressActivity_Methods } from "../../../../../main/handlers/DBAddressActivitySingalHandler";
import { useDispatch } from "react-redux";
import { reloadTransactionsAndSetAddressActivityFetch } from "../../../../state/transactions/actions";
import { useBlockNumber } from "../../../../state/application/hooks";

const { Text } = Typography;

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const transactions = useTransactions(activeAccount);
  const [clickTransaction, setClickTransaction] = useState<TransactionDetails>();
  const dispatch = useDispatch();
  const latestBlockNumber = useBlockNumber();

  useEffect(() => {
    if (activeAccount) {
      const method = DB_AddressActivity_Methods.loadActivities;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, method, [activeAccount]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBAddressActivitySignal && arg[1] == method) {
          const rows = arg[2][0];
          let dbStoredRange = {
            start: latestBlockNumber,
            end: 1
          };
          const txns = rows.map((row: any) => {
            const { timestamp , block_number } = row;
            if (timestamp) {
              dbStoredRange.start = Math.min(dbStoredRange.start, block_number);
              dbStoredRange.end = Math.max(dbStoredRange.end, block_number);
            }
            return Activity2Transaction(row);
          });
          dispatch(reloadTransactionsAndSetAddressActivityFetch({
            txns,
            addressActivityFetch: {
              address: activeAccount,
              blockNumberStart: dbStoredRange.end,
              blockNumberEnd: latestBlockNumber == 0 ? 99999999 : latestBlockNumber,
              current: 1,
              pageSize: 0,
              status: 0,
              dbStoredRange
            }
          }));
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
