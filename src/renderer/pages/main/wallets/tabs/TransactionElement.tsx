
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import SAFE_LOGO from "../../../../assets/logo/SAFE.png";
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import "./index.css";
import { useMemo, useState } from "react";
import { TransactionDetails } from "../../../../state/transactions/reducer";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import TransactionElementTransfer from "./TransactionElementTransfer";
import TransactionElementCall from "./TransactionElementCall";

export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const activeAccount = useWalletsActiveAccount();
  const ElementRender = useMemo(() => {
    const {
      transfer, call
    } = transaction;
    if (transfer) {
      return <>
        <TransactionElementTransfer transaction={transaction} setClickTransaction={setClickTransaction} />
      </>
    }
    if (call) {
      return <>
        <TransactionElementCall transaction={transaction} setClickTransaction={setClickTransaction} />
      </>
    }
    return <></>
  }, [activeAccount, transaction])

  return <>
    {ElementRender}
  </>
}
