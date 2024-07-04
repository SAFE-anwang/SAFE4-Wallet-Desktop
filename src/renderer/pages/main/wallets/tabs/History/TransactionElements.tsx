
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransaction, useTransactions } from "../../../../../state/transactions/hooks";
import { LoadingOutlined, FileDoneOutlined, LockOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useCallback, useMemo, useState } from "react";
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
import SAFE_LOGO from "../../../../../assets/logo/SAFE.png";
const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const {
    accountManagerDatas,
    internalTransfers,
  } = transaction;

  const isFirstIndex = useCallback((eventLogIndex: string, type: string) => {

    if ( internalTransfers && type != 'internal' ){
      return false;
    }
    if (internalTransfers && type == 'internal') {
      return Object.keys(internalTransfers).indexOf(eventLogIndex) == 0
    }
    if (!internalTransfers && accountManagerDatas && type == 'am'){
      return Object.keys(accountManagerDatas).indexOf(eventLogIndex) == 0
    }
    return false;
  }, [accountManagerDatas, internalTransfers])

  return <>
    {
      <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <Row style={{ width: "100%" }}>

          {
            internalTransfers && Object
              .keys(internalTransfers)
              .map(eventLogIndex => {
                const internalTransfer = internalTransfers[eventLogIndex];
                const { from, to, value } = internalTransfer;
                const marginTop = isFirstIndex(eventLogIndex, 'internal') ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
                  <TransactionElementTemplate
                    icon={SAFE_LOGO}
                    title="接收"
                    status={1}
                    description={from}
                    assetFlow={<>
                      <Text type="success" strong>
                        +{value && EtherAmount({ raw: value, fix: 18 })} SAFE
                      </Text>
                    </>}
                  />
                </span>
              })
          }

          {
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Deposit)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                const marginTop = isFirstIndex(eventLogIndex, "am") ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
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
                const marginTop = isFirstIndex(eventLogIndex, "am") ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
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
                const marginTop = isFirstIndex(eventLogIndex, "am") ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
                  <AccountManagerSafeTransfer from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }

        </Row>
      </List.Item>
    }
  </>
}
