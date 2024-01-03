import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import "./index.css"
import TransactionElement from "./TransactionElement";
import { useMemo, useState } from "react";
import { TransactionDetails } from "../../../../state/transactions/reducer";

export default () => {

  const transactions = useTransactions();
  const [showTxDetailModal, setShowTxDetailModal] = useState<boolean>(false);

  const dataSource = useMemo(()=>{
    const dataSource : TransactionDetails[] = [];
    Object.keys(transactions)
      .map( hash => {
        dataSource.push(transactions[hash])
      })
    return dataSource;
  },[transactions]);

  return <>
    History .. <br />
    <Button onClick={()=>setShowTxDetailModal(true)}>show</Button>
    <br />
    {Object.keys(transactions)
      .map(hash => {
        return <>{hash}<br />{JSON.stringify(transactions[hash])}<br /></>
      })}
    <br /><br />
    <br /><br />
    <Modal title="交易详情" closable footer={null} open={showTxDetailModal} onCancel={() => setShowTxDetailModal(false)}>
      <Button onClick={() => setShowTxDetailModal(false)}>aaa</Button>
    </Modal>

    <List
      itemLayout="horizontal"
      dataSource={dataSource}
      renderItem={(item, index) => (
        <TransactionElement transaction={item} />
      )}
    />
  </>

}
