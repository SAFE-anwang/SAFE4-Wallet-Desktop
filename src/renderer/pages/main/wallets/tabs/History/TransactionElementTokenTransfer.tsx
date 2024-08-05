
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../../state/transactions/hooks";
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useMemo, useState } from "react";
import { TokenTransfer, TransactionDetails } from "../../../../../state/transactions/reducer";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TransactionElementTemplate from "./TransactionElementTemplate";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";

const { Text } = Typography;

const TX_TYPE_SEND = "1";
const TX_TYPE_RECEIVE = "2";

export default ({ tokenTransfer }: {
  tokenTransfer: TokenTransfer
}) => {
  const {
    from, to, value,
    token
  } = tokenTransfer;
  const activeAccount = useWalletsActiveAccount();
  const txType = useMemo(() => {
    if (from == activeAccount) {
      return TX_TYPE_SEND;
    }
    if (to == activeAccount) {
      return TX_TYPE_RECEIVE;
    }
  }, [activeAccount, tokenTransfer]);

  const tokenAmount = useMemo( () => {
    const { name , symbol , address , decimals } = token;
    const tokenAmount = new TokenAmount(
      new Token( ChainId.MAINNET , address , decimals , symbol , name  ),
      value
    );
    return tokenAmount.toExact();
  } , [ value , token ] );

  return <>
    <TransactionElementTemplate
      icon={<></>}
      title={ txType == TX_TYPE_SEND ? "发送" : "接收" }
      status={1}
      description={ txType == TX_TYPE_SEND ? to : from }
      assetFlow={<>
        <Text type={ txType == TX_TYPE_RECEIVE ? "success" : undefined } strong>
          {
            txType == TX_TYPE_RECEIVE ? "+" : "-"
          }
          {value && tokenAmount} {token.symbol}
        </Text>
      </>}
    />
  </>
}
