
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
import { DB_AddressActivity_Actions } from "../../../../../main/handlers/DBAddressActivitySingalHandler";
import AccountManagerSafeDeposit from "./AccountManagerSafeDeposit";
const { Text } = Typography;

const Lock_To_Self = "1";
const Lock_To_Out = "2";

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const activeAccount = useWalletsActiveAccount();
  const {
    status,
    call,
    accountManagerDatas
  } = transaction;
  const { from, to, value, input } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: support.inputDecodeResult._to,
      value: call?.value,
      input: call?.input
    }
  }, [transaction, call]);

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        !call && accountManagerDatas && 
          accountManagerDatas.filter( accountManagerData => accountManagerData.action == DB_AddressActivity_Actions.AM_Deposit )
            .map( accountManagerData => {
              return <AccountManagerSafeDeposit from={from} to={to} value={value} status={1} />
            })
      }
      {
        call && <AccountManagerSafeDeposit from={from} to={to} value={value} status={status} />
      }
    </List.Item>
  </>

}
