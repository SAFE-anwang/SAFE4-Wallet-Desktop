
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import SAFE_LOGO from "../../../../assets/logo/SAFE.png";
import { LoadingOutlined, FileDoneOutlined, LockOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import "./index.css";
import { useMemo, useState } from "react";
import { TransactionDetails } from "../../../../state/transactions/reducer";
import { ethers } from "ethers";
import EtherAmount from "../../../../utils/EtherAmount";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import DecodeSupportFunction from "../../../../constants/DecodeSupportFunction";
import TransactionElementSupport from "./TransactionElementSupport";
import TransactionElementAMDeposit from "./TransactionElementAMDeposit";
const { Text } = Typography;

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const {
    call
  } = transaction;
  return <>
    <TransactionElementAMDeposit transaction={transaction} setClickTransaction={setClickTransaction} support={support}  />
  </>
}
