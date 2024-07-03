
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransaction, useTransactions } from "../../../../../state/transactions/hooks";
import { LoadingOutlined, FileDoneOutlined, LockOutlined, RetweetOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useCallback, useMemo, useState } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { ethers } from "ethers";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TransactionElementTemplate from "./TransactionElementTemplate";
import SAFE_LOGO from "../../../../../assets/logo/SAFE.png";

const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {

  const {
    internalTransfers , status
  } = transaction;

  const isFirstIndex = useCallback((eventLogIndex: string) => {
    if (internalTransfers) {
      return Object.keys(internalTransfers).indexOf(eventLogIndex) == 0
    }
    return false;
  }, [internalTransfers])

  return <>
    {
      <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <Row style={{ width: "100%" }}>
          {
            internalTransfers && Object
              .keys(internalTransfers)
              .map(eventLogIndex => {
                const internalTransfer = internalTransfers[eventLogIndex];
                const { from , to , value } = internalTransfer;
                const marginTop = isFirstIndex(eventLogIndex) ? "" : "20px";
                return <span style={{ width: "100%", marginTop }}>
                  <TransactionElementTemplate
                    icon={SAFE_LOGO}
                    title="接收"
                    status={status}
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
        </Row>
      </List.Item>
    }
  </>
}
