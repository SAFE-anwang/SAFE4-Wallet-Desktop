
import { Col, Row, Avatar, List, Typography, Modal, Button, Spin } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import { SupportSafeswapV2RouterFunctions } from "../../../../../constants/DecodeSupportFunction";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import { LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useWeb3React } from "@web3-react/core";
import { CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { useTokens } from "../../../../../state/transactions/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../../../config";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTranslation } from "react-i18next";
import { useSafeswapWalletTokens } from "../../../safeswap/hooks";

const { Text } = Typography;

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
  const tokens = useSafeswapWalletTokens(false);
  const tokensMap = useMemo<{ [address: string]: Token } | undefined>(() => {
    if (chainId && tokens) {
      const tokensMap = Object.values(tokens).reduce((map, token) => {
        map[token.address] = token;
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

    if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapExactETHForTokens
      || supportFuncName == SupportSafeswapV2RouterFunctions.SwapETHForExactTokens) {
      // swapExactETHForTokens( uint256 amountOutMin, address[] path, address to, uint256 deadline)
      // swapETHForExactTokens( uint256 amountOut, address[] path, address to, uint256 deadline )
      let path = inputDecodeResult[1];
      let to = inputDecodeResult[2];
      swapTo = to;
      const tokenBAddress: string = path[path.length - 1];
      tokenB = tokensMap && tokensMap[tokenBAddress];
      let tokenAInput = call?.value;
      tokenAAmount = tokenAInput ? CurrencyAmount.ether(tokenAInput) : undefined;
      const tokenBReceives = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.to == to && tokenTransfer.token.address.toLocaleLowerCase() == tokenBAddress.toLocaleLowerCase();
      });
      if (tokenBReceives && tokenBReceives.length > 0) {
        if (!tokenB && chainId) {
          const { symbol, name, decimals, address } = tokenBReceives[0].token;
          tokenB = new Token(chainId, address, decimals, symbol, name);
        }
        tokenBAmount = tokenB && tokenBReceives.reduce((tokenAmount, tokenTransfer) => {
          const receive = new TokenAmount(tokenAmount.token, tokenTransfer.value);
          return tokenAmount.add(receive);
        }, new TokenAmount(tokenB, "0"));
      }
      const tokenAReceives = internalTransfers && Object.values(internalTransfers).filter(internalTransfer => {
        return internalTransfer.to == activeAccount;
      })
      if (tokenAAmount && tokenAReceives && tokenAReceives.length > 0) {
        tokenAAmount = tokenAReceives.reduce((tokenAAmount, internalTransfer) => {
          return tokenAAmount.subtract(CurrencyAmount.ether(internalTransfer.value));
        }, tokenAAmount);
      }
    }

    // swapExactTokensForETH( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
    // swapTokensForExactETH( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )
    if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapExactTokensForETH
      || supportFuncName == SupportSafeswapV2RouterFunctions.SwapTokensForExactETH
    ) {
      let path = inputDecodeResult[2];
      const tokenAAddress: string = path[0];
      let to = inputDecodeResult[3];
      swapTo = to;
      tokenA = tokensMap && tokensMap[tokenAAddress];
      if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapExactTokensForETH) {
        // swapExactTokensForETH( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
        let amountIn = inputDecodeResult[0];
        tokenAAmount = tokenA && new TokenAmount(tokenA, amountIn);
      } else if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapTokensForExactETH) {
        // swapTokensForExactETH( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )
        let amountIn = inputDecodeResult[1];
        tokenAAmount = tokenA && new TokenAmount(tokenA, amountIn);
      }
      const tokenBReceives = internalTransfers && Object.values(internalTransfers).filter(internalTransfer => {
        return internalTransfer.to == activeAccount;
      });
      if (tokenBReceives && tokenBReceives.length > 0) {
        tokenBAmount = tokenBReceives && tokenBReceives.reduce((tokenBAmount, internalTransfer) => {
          return tokenBAmount.add(CurrencyAmount.ether(internalTransfer.value));
        }, CurrencyAmount.ether("0"));
      }
      const tokenASpents = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.token.address.toLocaleLowerCase() == tokenA?.address.toLocaleLowerCase()
          && tokenTransfer.from == activeAccount;
      });
      if (tokenA && tokenASpents != undefined && tokenASpents.length > 0) {
        tokenAAmount = tokenASpents.reduce((tokenAAmount, tokenTransfer) => {
          if (tokenA) {
            tokenAAmount = tokenAAmount.add(new TokenAmount(tokenA, tokenTransfer.value));
          }
          return tokenAAmount;
        }, new TokenAmount(tokenA, "0"))
      }
    }

    // swapExactTokensForTokens( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
    // swapTokensForExactTokens( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )
    if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapExactTokensForTokens ||
      supportFuncName == SupportSafeswapV2RouterFunctions.SwapTokensForExactTokens
    ) {
      let path = inputDecodeResult[2];
      const tokenAAddress: string = path[0];
      const tokenBAddress: string = path[path.length - 1];
      let to = inputDecodeResult[3];
      swapTo = to;
      tokenA = tokensMap && tokensMap[tokenAAddress];
      tokenB = tokensMap && tokensMap[tokenBAddress];

      if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapExactTokensForTokens) {
        // swapExactTokensForTokens( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
        tokenAAmount = tokenA && new TokenAmount(tokenA, inputDecodeResult[0]);
      } else if (supportFuncName == SupportSafeswapV2RouterFunctions.SwapTokensForExactTokens) {
        // swapTokensForExactTokens( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )
        tokenAAmount = tokenA && new TokenAmount(tokenA, inputDecodeResult[1]);
      }
      const tokenASpents = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.from == activeAccount && tokenTransfer.token.address.toLocaleLowerCase() == tokenAAddress.toLocaleLowerCase();
      });
      if (tokenASpents && tokenASpents.length > 0 && chainId) {
        if (!tokenA) {
          const { address, name, symbol, decimals } = tokenASpents[0].token;
          tokenA = new Token(chainId, address, decimals, symbol, name);
        }
        tokenAAmount = Object.values(tokenASpents).reduce((tokenAAmount, tokenTransfer) => {
          if (tokenA) {
            tokenAAmount = tokenAAmount.add(new TokenAmount(tokenA, tokenTransfer.value))
          }
          return tokenAAmount;
        }, new TokenAmount(tokenA, "0"))
      }
      const tokenBReceives = tokenTransfers && Object.values(tokenTransfers).filter(tokenTransfer => {
        return tokenTransfer.to == to;
      });
      if (tokenBReceives && tokenBReceives.length > 0 && chainId) {
        if (!tokenB) {
          const { address, name, symbol, decimals } = tokenBReceives[0].token;
          tokenB = new Token(chainId, address, decimals, symbol, name);
        }
        tokenBAmount = Object.values(tokenBReceives).reduce((tokenBAmount, tokenTransfer) => {
          if (tokenB) {
            tokenBAmount = tokenBAmount.add(new TokenAmount(tokenB, tokenTransfer.value));
          }
          return tokenBAmount;
        }, new TokenAmount(tokenB, "0"))
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
        {tokenAAmount && <Text strong>-{tokenAAmount && tokenAAmount.toSignificant()} {tokenA ? tokenA.symbol : "SAFE"}</Text>}
      </Col>
      <Col span={24} style={{ textAlign: "right" }}>
        {tokenBAmount && <Text type="success" strong>+{tokenBAmount && tokenBAmount.toSignificant()} {tokenB ? tokenB.symbol : "SAFE"}</Text>}
      </Col>
    </Row>
  }

  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      <List.Item.Meta
        key={transaction.hash}
        title={t("wallet_safeswap_swap")}
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
