
import { Col, Row, Avatar, List, Typography, Modal, Button, Spin } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { SupportSafeswapV2RouterFunctions } from "../../../../../constants/DecodeSupportFunction";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import { LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useWeb3React } from "@web3-react/core";
import { CurrencyAmount, Rounding, Token, TokenAmount } from "@uniswap/sdk";
import { useTokens } from "../../../../../state/transactions/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../../../config";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  }
}) => {
  const { chainId } = useWeb3React();
  const { t } = useTranslation();
  const tokens = useTokens();
  const tokensMap = useMemo<{ [address: string]: Token } | undefined>(() => {
    if (chainId) {
      const tokensMap = Object.keys(tokens).reduce((map, address) => {
        const { name, symbol, decimals } = tokens[address];
        map[address] = new Token(chainId, address, decimals, symbol, name);
        return map;
      }, {} as { [address: string]: Token });
      tokensMap[WSAFE[chainId as Safe4NetworkChainId].address] = WSAFE[chainId as Safe4NetworkChainId];
      tokensMap[USDT[chainId as Safe4NetworkChainId].address] = USDT[chainId as Safe4NetworkChainId];
      return tokensMap;
    }
    return undefined;
  }, [tokens, chainId]);
  const activeAccount = useWalletsActiveAccount();

  const {
    status,
    call,
    internalTransfers,
    tokenTransfers
  } = transaction;
  const { from, value } = useMemo(() => {
    return {
      from: transaction.refFrom,
      value: call?.value,
      input: call?.input,
    }
  }, [transaction, call, support]);

  const { supportFuncName, inputDecodeResult } = support;
  const { tokenA, tokenB, tokenAAmount, tokenBAmount, to } = useMemo<{
    tokenA: Token | undefined,
    tokenB: Token | undefined,
    tokenAAmount: CurrencyAmount | undefined,
    tokenBAmount: CurrencyAmount | undefined,
    to: string | undefined
  }>(() => {
    let tokenA: Token | undefined = undefined;
    let tokenB: Token | undefined = undefined;
    let tokenAAmount: CurrencyAmount | undefined = undefined;
    let tokenBAmount: CurrencyAmount | undefined = undefined;
    let swapTo: string | undefined = undefined;

    if (supportFuncName == SupportSafeswapV2RouterFunctions.RemoveLiquidityETHWithPermit) {
      // removeLiquidityETHWithPermit( address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s )
      const tokenAddress = inputDecodeResult[0];
      const amount = inputDecodeResult[2];
      const safeValue = inputDecodeResult[3];
      let to = inputDecodeResult[4];
      swapTo = to;

      tokenA = tokensMap && tokensMap[tokenAddress];
      tokenAAmount = tokenA && new TokenAmount(tokenA, amount);
      tokenBAmount = CurrencyAmount.ether(safeValue);

      const tokenReceives = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.to == activeAccount && tokenTransfer.token.address.toLocaleLowerCase() == tokenA?.address.toLocaleLowerCase()
      });
      if (tokenReceives && tokenA) {
        tokenAAmount = tokenReceives.reduce((tokenAmount, tokenTransfer) => {
          if (tokenA) {
            tokenAmount = tokenAmount.add(new TokenAmount(tokenA, tokenTransfer.value));
          }
          return tokenAmount;
        }, new TokenAmount(tokenA, "0"));
      }
      const safeReceives = internalTransfers && Object.values(internalTransfers).filter(internalTransfer => {
        return internalTransfer.to == activeAccount;
      })
      if (safeReceives) {
        tokenBAmount = safeReceives.reduce((amount, internalTransfer) => {
          return amount.add(CurrencyAmount.ether(internalTransfer.value))
        }, CurrencyAmount.ether("0"));
      }
    } else if (supportFuncName == SupportSafeswapV2RouterFunctions.RemoveLiquidityWithPermit) {
      // removeLiquidityWithPermit( address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s )
      const tokenAAddress = inputDecodeResult[0];
      const tokenBAddress = inputDecodeResult[1];
      let to = inputDecodeResult[5];
      swapTo = to;
      tokenA = tokensMap && tokensMap[tokenAAddress];
      tokenB = tokensMap && tokensMap[tokenBAddress];
      tokenAAmount = tokenA && new TokenAmount(tokenA, inputDecodeResult[3]);
      tokenBAmount = tokenB && new TokenAmount(tokenB, inputDecodeResult[4]);

      const tokenAReceives = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.to == activeAccount && tokenTransfer.token.address.toLocaleLowerCase() == tokenA?.address.toLocaleLowerCase()
      });
      if (tokenAReceives && tokenA) {
        tokenAAmount = tokenAReceives.reduce((tokenAmount, tokenTransfer) => {
          if (tokenA) {
            tokenAmount = tokenAmount.add(new TokenAmount(tokenA, tokenTransfer.value));
          }
          return tokenAmount;
        }, new TokenAmount(tokenA, "0"));
      }
      const tokenBReceives = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.to == activeAccount && tokenTransfer.token.address.toLocaleLowerCase() == tokenB?.address.toLocaleLowerCase()
      });
      if (tokenBReceives && tokenB) {
        tokenBAmount = tokenBReceives.reduce((tokenAmount, tokenTransfer) => {
          if (tokenB) {
            tokenAmount = tokenAmount.add(new TokenAmount(tokenB, tokenTransfer.value));
          }
          return tokenAmount;
        }, new TokenAmount(tokenB, "0"));
      }
    }

    return {
      tokenA, tokenB,
      tokenAAmount, tokenBAmount,
      to: swapTo
    };
  }, [supportFuncName, inputDecodeResult, value, tokenTransfers, internalTransfers, tokensMap, chainId, activeAccount]);

  const RenderTokensForTokens = () => {
    return <>
      {
        tokenA && chainId && <ERC20TokenLogoComponent style={{ marginTop: "8px", width: "34px", height: "34px" }}
          address={tokenA.address} chainId={chainId} />
      }
      {
        !tokenA && <Avatar style={{ marginTop: "8px", padding: "2px", width: "36px", height: "36px" }} src={SAFE_LOGO} />
      }
      {
        !tokenB && <Avatar style={{ marginTop: "8px", marginLeft: "-10px", padding: "2px", width: "36px", height: "36px" }} src={SAFE_LOGO} />
      }
      {
        tokenB && chainId && <ERC20TokenLogoComponent style={{ marginTop: "8px", width: "34px", height: "34px", marginLeft: "-10px" }}
          address={tokenB.address} chainId={chainId} />
      }
    </>

  }

  const RenderSwapAmount = () => {
    return <Row>
      <Col span={24} style={{ textAlign: "right" }}>
        {tokenAAmount && <Text type="success" strong>+{tokenAAmount && tokenAAmount.toSignificant(undefined, undefined, Rounding.ROUND_DOWN)} {tokenA ? tokenA.symbol : "SAFE"}</Text>}
      </Col>
      <Col span={24} style={{ textAlign: "right" }}>
        {tokenBAmount && <Text type="success" strong>+{tokenBAmount && tokenBAmount.toSignificant(undefined, undefined, Rounding.ROUND_DOWN)} {tokenB ? tokenB.symbol : "SAFE"}</Text>}
      </Col>
    </Row>
  }

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      <List.Item.Meta
        key={transaction.hash}
        title={t("wallet_safeswap_liquidity_removeliquidity")}
        avatar={
          <>
            <span>
              {
                !status && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", marginLeft: "-17px", marginTop: "-14px" }} />} >
                  {RenderTokensForTokens()}
                </Spin>
              }
              {
                status && <>
                  {RenderTokensForTokens()}
                </>
              }
            </span>
          </>
        }
        description={
          <>{to}</>
        } />
      {RenderSwapAmount()}
    </List.Item>
  </>

}
