
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../../state/transactions/hooks";
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useMemo, useState } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const TX_TYPE_SEND = "1";
const TX_TYPE_RECEIVE = "2";

export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {
  const { t } = useTranslation();
  const {
    status,
    receipt,
    transfer
  } = transaction;
  const { from, to, value } = transfer ? transfer : {
    from: null, to: null, value: null
  };
  const activeAccount = useWalletsActiveAccount();
  const txType = useMemo(() => {
    if (from == activeAccount) {
      return TX_TYPE_SEND;
    }
    if (to == activeAccount) {
      return TX_TYPE_RECEIVE;
    }
  }, [activeAccount, transfer])

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      <List.Item.Meta
        avatar={
          <>
            <span>
              {
                !status && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", marginLeft: "-17px", marginTop: "-14px" }} />} >
                  <Avatar style={{ marginTop: "8px", padding: "1px" }} src={SAFE_LOGO} />
                </Spin>
              }
              {
                status && <Avatar style={{ marginTop: "8px", padding: "1px" }} src={SAFE_LOGO} />
              }
            </span>
          </>
        }
        title={<>
          <Text strong>
            {txType == TX_TYPE_RECEIVE && t("wallet_history_received")}
            {txType == TX_TYPE_SEND && t("wallet_history_send")}
          </Text>
        </>}
        description={
          <>
            {txType == TX_TYPE_RECEIVE && from}
            {txType == TX_TYPE_SEND && to}
          </>
        }
      />
      <div>
        {txType == TX_TYPE_RECEIVE && <>
          <Text strong type="success">+{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
        </>}
        {txType == TX_TYPE_SEND && <>
          <Text strong>-{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
        </>}
      </div>
    </List.Item>
  </>
}
