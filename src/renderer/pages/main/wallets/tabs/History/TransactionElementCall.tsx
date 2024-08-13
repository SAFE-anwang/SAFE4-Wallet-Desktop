
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
import TransactionElementTokenTransfer from "./TransactionElementTokenTransfer";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";

const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {
  const {
    status,
    call,
    accountManagerDatas,
    internalTransfers,
    tokenTransfers
  } = transaction;
  const { value, input, action } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: transaction.refTo,
      action: call?.action ? call.action : transaction.action,
      value: call?.value,
      input: call?.input,
    }
  }, [transaction]);
  const support = DecodeSupportFunction(call?.to, input);

  // 判断是否为调用 ERC20.transfer(to,uint256)
  const isTokenTransfer = useMemo(() => {
    if (call?.tokenTransfer) {
      return true;
    }
    if (call?.input.indexOf("0xa9059cbb") == 0) {
      return tokenTransfers && Object.keys(tokenTransfers).length == 1;
    }
    return false;
  }, [call, tokenTransfers]);

  const RenderTokenTransfer = useCallback(() => {
    let firstTokenTransfer = undefined;
    if ( tokenTransfers ){
      Object.keys( tokenTransfers )
        .forEach( (eventLogIndex , index : number) => {
          if ( index == 0 ){ firstTokenTransfer = tokenTransfers[eventLogIndex] }
        })
    }
    const tokenTransfer = call?.tokenTransfer ? call.tokenTransfer : tokenTransfers ? firstTokenTransfer : undefined;
    return <>
      <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <span style={{ width: "100%" }}>
          {tokenTransfer && <TransactionElementTokenTransfer status={status} tokenTransfer={tokenTransfer} />}
        </span>
      </List.Item>
    </>
  }, [transaction, status])

  return <>
    {/* <Text>{JSON.stringify(transaction)}</Text> */}
    {
      support && <TransactionElementCallSupport transaction={transaction} setClickTransaction={setClickTransaction} support={support} />
    }
    {
      !support && isTokenTransfer && <>
        {RenderTokenTransfer()}
      </>
    }
    {
      !support && !isTokenTransfer && <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <Row style={{ width: "100%" }}>
          <span style={{ width: "100%" }}>
            <TransactionElementTemplate status={status} icon={<FileDoneOutlined style={{ color: "black" }} />}
              title={action == "Create" ? "合约部署" : "合约调用"} description={call?.to} assetFlow={<Text strong> <>- {value && EtherAmount({ raw: value })} SAFE</> </Text>} />
          </span>
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
            internalTransfers && Object
              .keys(internalTransfers)
              .map(eventLogIndex => {
                const internalTransfer = internalTransfers[eventLogIndex];
                const { from, to, value } = internalTransfer;
                return <span style={{ width: "100%", marginTop: "20px" }}>
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
          {
            tokenTransfers && Object
              .keys(tokenTransfers)
              .map(eventLogIndex => {
                const tokenTransfer = tokenTransfers[eventLogIndex]
                return <>
                  <span style={{ width: "100%", marginTop: "20px" }}>
                    <TransactionElementTokenTransfer status={status} tokenTransfer={tokenTransfer} />
                  </span>
                </>
              })
          }
        </Row>
      </List.Item>
    }
  </>
}
