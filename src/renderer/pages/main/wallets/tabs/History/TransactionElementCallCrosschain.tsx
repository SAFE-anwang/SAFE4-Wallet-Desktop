import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { Avatar, List, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { SAFE_LOGO, USDT_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { getNetworkLogoByCoin, getNetworkNameByCoin, NetworkCoinType } from "../../../../../assets/logo/NetworkLogo";
import { TransactionDetails } from "../../../../../state/transactions/reducer"
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useWeb3React } from "@web3-react/core";
import { Safe4NetworkChainId, USDT } from "../../../../../config";
import { useMemo } from "react";
import { TokenAmount } from "@uniswap/sdk";

const { Text } = Typography;

const enum CrosschainDirectoinType {
  SEND = 1,
  RECEIVE = 2
}

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const Token_USDT = USDT[chainId as Safe4NetworkChainId];
  const { supportFuncName , inputDecodeResult } = support;
  const {
    status,
    call,
  } = transaction;

  const { from, to, value } = {
    from : call?.from,
    to   : inputDecodeResult._dst_address,
    value: inputDecodeResult._value
  }
  const activeAccount = useWalletsActiveAccount();
  // TODO
  const networkCoin = support.supportFuncName.substring(0, support.supportFuncName.indexOf("2"));
  const crosschainDirectoinType = from == activeAccount ? CrosschainDirectoinType.SEND : CrosschainDirectoinType.RECEIVE;

  const RenderLogosCrossDirectoin = () => {
    const NETWORK_LOGO = getNetworkLogoByCoin(networkCoin as NetworkCoinType)
    if (crosschainDirectoinType == CrosschainDirectoinType.SEND) {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={USDT_LOGO} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={NETWORK_LOGO} />
      </>
    } else {
      return <>
        <Avatar style={{ marginTop: "8px" }} src={NETWORK_LOGO} />
        <Avatar style={{ marginTop: "8px", marginLeft: "-15px" }} src={USDT_LOGO} />
      </>
    }
  }

  return <>
    {
      // <Text>{JSON.stringify(transaction["tokenTransfers"])}</Text>
    }
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      <List.Item.Meta
        avatar={
          <>
            <span>
              {
                !status && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", marginLeft: "-17px", marginTop: "-14px" }} />} >
                  {RenderLogosCrossDirectoin()}
                </Spin>
              }
              {
                status && <>
                  {RenderLogosCrossDirectoin()}
                </>
              }
            </span>
          </>
        }
        title={<>
          <Text strong>
            {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && t("wallet_history_received")}
            {crosschainDirectoinType == CrosschainDirectoinType.SEND && `跨链到 ${getNetworkNameByCoin(networkCoin as NetworkCoinType)} 网络`}
          </Text>
        </>}
        description={
          <>
            {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && from}
            {crosschainDirectoinType == CrosschainDirectoinType.SEND && to}
          </>
        }
      />
      <div>
        {crosschainDirectoinType == CrosschainDirectoinType.RECEIVE && <>
          <Text strong type="success">+{value && new TokenAmount(Token_USDT,value).toFixed(2)}  {Token_USDT.name}</Text>
        </>}
        {crosschainDirectoinType == CrosschainDirectoinType.SEND && <>
          <Text strong>-{value && new TokenAmount(Token_USDT,value).toExact()} {Token_USDT.name}</Text>
        </>}
      </div>
    </List.Item>
  </>
}
