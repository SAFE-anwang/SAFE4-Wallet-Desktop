
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useCallback, useMemo, useState } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import EtherAmount from "../../../../../utils/EtherAmount";
import TransactionElementTemplate from "./TransactionElementTemplate";
import AccountManagerSafeDeposit from "./AccountManagerSafeDeposit";
import { DB_AddressActivity_Actions } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
import AccountManagerSafeWithdraw from "./AccountManagerSafeWithdraw";
import AccountManagerSafeTransfer from "./AccountManagerSafeTransfer";
import TransactionElementTokenTransfer from "./TransactionElementTokenTransfer";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useTranslation } from "react-i18next";
const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const { t } = useTranslation();
  const {
    accountManagerDatas,
    internalTransfers,
    tokenTransfers
  } = transaction;

  const isFirstIndex = useCallback((eventLogIndex: string, type: string) => {
    if (internalTransfers && type != 'internal') {
      return false;
    }
    if (internalTransfers && type == 'internal') {
      return Object.keys(internalTransfers).indexOf(eventLogIndex) == 0
    }
    if (!internalTransfers) {
      if (accountManagerDatas && type == 'am') {
        return Object.keys(accountManagerDatas).indexOf(eventLogIndex) == 0;
      }
      if (tokenTransfers && type == 'token') {
        return Object.keys(tokenTransfers).indexOf(eventLogIndex) == 0
      }
    }
    return false;
  }, [accountManagerDatas, internalTransfers, tokenTransfers])

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
                    title={t("wallet_history_received")}
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
          {
            tokenTransfers && Object
              .keys(tokenTransfers)
              .map(eventLogIndex => {
                const tokenTransfer = tokenTransfers[eventLogIndex];
                const marginTop = isFirstIndex(eventLogIndex, "token") ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
                  <TransactionElementTokenTransfer transaction={transaction} status={1} tokenTransfer={tokenTransfer} />
                </span>
              })
          }
        </Row>
      </List.Item>
    }
  </>
}
