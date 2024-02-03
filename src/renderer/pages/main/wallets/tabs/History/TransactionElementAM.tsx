
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransaction, useTransactions } from "../../../../../state/transactions/hooks";
import { LoadingOutlined, FileDoneOutlined, LockOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useMemo, useState } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import DecodeSupportFunction from "../../../../../constants/DecodeSupportFunction";
import TransactionElementTemplate from "./TransactionElementTemplate";
import AccountManagerSafeDeposit from "./AccountManagerSafeDeposit";
import { DB_AddressActivity_Actions } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
import TransactionElementCallSupport from "./TransactionElementCallSupport";
import AccountManagerSafeWithdraw from "./AccountManagerSafeWithdraw";
import AccountManagerSafeTransfer from "./AccountManagerSafeTransfer";
const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const {
    accountManagerDatas
  } = transaction;

  return <>
    {
      <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <Row style={{ width: "100%" }}>
          {
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Deposit)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                return <span style={{ width: "100%", marginTop: "20px" }}>
                  <AccountManagerSafeDeposit from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }
          {
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Withdraw)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                return <span style={{ width: "100%", marginTop: "20px" }}>
                  <AccountManagerSafeWithdraw from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }
          { 
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Transfer)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                const marginTop = eventLogIndex == "1" ? "" : "20px";
                return <span style={{ width: "100%" , marginTop }}>
                  <AccountManagerSafeTransfer from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }
        </Row>
      </List.Item>
    }
  </>
}
