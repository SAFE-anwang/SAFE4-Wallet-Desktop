
import { Col, Row, Avatar, List, Typography, Modal, Button, Image } from "antd";
import { useMemo, useState } from "react";
import { TokenTransfer, TransactionDetails } from "../../../../../state/transactions/reducer";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TransactionElementTemplate from "./TransactionElementTemplate";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useTranslation } from "react-i18next";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../../../config";

const { Text } = Typography;

const TX_TYPE_SEND = "1";
const TX_TYPE_RECEIVE = "2";

export default ({ tokenTransfer, status }: {
  tokenTransfer: TokenTransfer,
  status?: number
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

  const tokenAmount = useMemo(() => {
    const { name, symbol, address, decimals } = token;
    const tokenAmount = new TokenAmount(
      new Token(ChainId.MAINNET, ethers.utils.getAddress(address), decimals, symbol, name),
      value
    );
    return tokenAmount.toExact();
  }, [value, token]);
  const { t } = useTranslation();
  const _address = ethers.utils.getAddress(token.address);
  const isWSAFE = (_address == WSAFE[Safe4NetworkChainId.Mainnet].address) || (_address == WSAFE[Safe4NetworkChainId.Testnet].address);
  const isUSDT = (_address == USDT[Safe4NetworkChainId.Mainnet].address) || (_address == USDT[Safe4NetworkChainId.Testnet].address);
  return <>
    <TransactionElementTemplate
      icon={ERC20_LOGO}
      iconOutput={(isWSAFE || isUSDT) ? () => <ERC20TokenLogoComponent style={{ width: "34px", height: "34px", marginTop: "4px" }} address={token.address} chainId={1} />
        : () => <ERC20TokenLogoComponent style={{ width: "32px", height: "32px", padding: "2px", background: "#efefef", marginTop: "4px" }} address={token.address} chainId={1} />}
      title={txType == TX_TYPE_SEND ? t("wallet_history_send") : t("wallet_history_received")}
      status={status}
      description={txType == TX_TYPE_SEND ? to : from}
      assetFlow={<>
        <Text type={txType == TX_TYPE_RECEIVE ? "success" : undefined} strong>
          {
            txType == TX_TYPE_RECEIVE ? "+" : "-"
          }
          {value && tokenAmount} {token.symbol}
        </Text>
      </>}
    />
  </>
}
