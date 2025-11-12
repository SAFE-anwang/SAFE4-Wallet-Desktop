import { ArrowDownOutlined, DownOutlined, LeftOutlined, RightOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, JSBI, Pair, Percent, Price, Token, TokenAmount, Trade, TradeType } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { calculatePairAddress } from "./Calculate";
import { useSafeswapSlippageTolerance, useSafeswapTokens } from "../../../state/application/hooks";
import { useTokens, useWalletTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import { IERC20_Interface } from "../../../abis";
import SwapConfirm from "./SwapConfirm";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import { SafeswapV2Pairs, useSafeswapV2Pairs, useSafeswapWalletTokens } from "./hooks";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenSymbol from "../../components/TokenSymbol";
const { Text, Link } = Typography;

export const SafeswapV2_Fee_Rate = "0.003";
export const SafeswapV2_Default_SlippageTolerance = "0.005"; // "0.5%"

export enum PriceType {
  A2B = "A2B",
  B2A = "B2A"
}
export const Default_Safeswap_Tokens = (chainId: Safe4NetworkChainId) => {
  return [
    USDT[chainId],
    undefined,
    // WSAFE[chainId],
  ]
}

export function parseTokenData(token: any): Token | undefined {
  if (token) {
    return new Token(token.chainId, token.address, token.decimals, token.symbol, token.name);
  }
  return undefined
}
export function SerializeToken(token: Token | undefined): {
  chainId: number, address: string, decimals: number, name?: string, symbol?: string
} | undefined {
  return token ? { ...token } : undefined;
}

export function getSlippageTolerancePercent(slippageTolerance: string): Percent {
  const a = ethers.utils.parseUnits(slippageTolerance);
  const b = ethers.utils.parseUnits("1");
  return new Percent(a.toString(), b.toString());
}

export function isDecimalPrecisionExceeded(amount: string, token: Token | undefined): boolean {
  // 将输入的金额字符串转为小数
  const decimalIndex = amount.indexOf(".");
  // 如果没有小数部分，说明小数位数为0
  if (decimalIndex === -1) {
    return false;
  }
  // 获取小数部分
  const decimalPlaces = amount.length - decimalIndex - 1;
  // 判断小数位是否超过代币精度
  return decimalPlaces > (token ? token.decimals : 18);
}

export default ({
  goToAddLiquidity,
  safeswapV2Pairs
}: {
  goToAddLiquidity: () => void,
  safeswapV2Pairs: SafeswapV2Pairs
}) => {
  const { loading, result } = safeswapV2Pairs;
  const pairsMap = result && result.pairsMap;
  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const dispatch = useDispatch();

  const Default_Swap_Token = chainId && Default_Safeswap_Tokens(chainId);

  const walletTokens = useSafeswapWalletTokens(false);
  const tokenAmounts = walletTokens && useTokenBalances(activeAccount, walletTokens);
  const balance = useETHBalances([activeAccount])[activeAccount];

  const safeswapTokens = useSafeswapTokens();
  const [tokenA, setTokenA] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenA) : Default_Swap_Token ? Default_Swap_Token[0] : undefined
  );
  const [tokenB, setTokenB] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenB) : Default_Swap_Token ? Default_Swap_Token[1] : undefined
  );

  const pairAddress = chainId && calculatePairAddress(tokenA, tokenB, chainId);
  const isValidPair = pairAddress != undefined;

  const pair = (pairsMap && pairAddress) && pairsMap[pairAddress];
  const balanceOfTokenA = tokenAmounts && tokenA ? tokenAmounts[tokenA.address] : balance;
  const balanceOfTokenB = tokenAmounts && tokenB ? tokenAmounts[tokenB.address] : balance;
  const [tokenInAmount, setTokenInAmount] = useState<string>();
  const [tokenOutAmount, setTokenOutAmount] = useState<string>();
  const [openSwapConfirmModal, setOpenSwapConfirmModal] = useState<boolean>(false);

  const [trade, setTrade] = useState<Trade>();
  const liquidityNotFound = (!loading && pair == undefined && trade == undefined && isValidPair);

  const balanceOfTokenANotEnough = useMemo(() => {
    if (tokenInAmount && balanceOfTokenA) {
      return tokenA ? new TokenAmount(tokenA, ethers.utils.parseUnits(tokenInAmount, tokenA.decimals).toBigInt()).greaterThan(balanceOfTokenA)
        : CurrencyAmount.ether(ethers.utils.parseUnits(tokenInAmount).toBigInt()).greaterThan(balanceOfTokenA)
    }
    return false;
  }, [tokenA, balanceOfTokenA, tokenInAmount]);

  const reserverOfTokenBNotEnough = useMemo(() => {
    if (tokenOutAmount && pair && chainId && !trade) {
      const _tokenB = tokenB ? tokenB : WSAFE[chainId as Safe4NetworkChainId];
      const _tokenOutAmount = new TokenAmount(_tokenB, ethers.utils.parseUnits(tokenOutAmount, tokenB?.decimals).toBigInt());
      const _tokenBReserve = pair.token0.equals(_tokenB) ? pair.reserve0 : pair.reserve1;
      return _tokenOutAmount.greaterThan(_tokenBReserve);
    }
  }, [pair, trade, tokenB, tokenOutAmount, chainId]);

  const calculate = useCallback((tokenInAmount: string | undefined, tokenOutAmount: string | undefined): CurrencyAmount | undefined => {
    if (chainId && pairsMap) {
      const _tokenA = tokenA ? tokenA : WSAFE[chainId as Safe4NetworkChainId];
      const _tokenB = tokenB ? tokenB : WSAFE[chainId as Safe4NetworkChainId];
      const pairs = Object.values(pairsMap);
      if (tokenInAmount) {
        const _tokenInAmount = new TokenAmount(
          _tokenA, ethers.utils.parseUnits(tokenInAmount, _tokenA.decimals).toBigInt()
        );
        const [trade] = Trade.bestTradeExactIn(pairs, _tokenInAmount, _tokenB, {
          maxHops: 3, maxNumResults: 1
        });
        setTrade(trade);
        if (trade) {
          const { outputAmount, route } = trade;
          return outputAmount;
        } else {
          console.log("Not Trade Found In Pairs");
        }
      } else if (tokenOutAmount) {
        const _tokenOutAmount = new TokenAmount(
          _tokenB, ethers.utils.parseUnits(tokenOutAmount, _tokenB.decimals).toBigInt()
        )
        const [trade] = Trade.bestTradeExactOut(pairs, _tokenA, _tokenOutAmount, {
          maxHops: 3, maxNumResults: 1
        });
        setTrade(trade);
        if (trade) {
          const { inputAmount, route } = trade;
          return inputAmount;
        } else {
          console.log("Not Trade Found In Pairs");
        }
      }
    }
    return undefined;
  }, [chainId, tokenA, tokenB, pairsMap]);

  const handleTokenInAmountInput = (_tokenInAmount: string) => {
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenInAmount, tokenA);
    const isValidInput = (_tokenInAmount == '') || Number(_tokenInAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      setTokenInAmount(_tokenInAmount);
      if (_tokenInAmount && isValidInput != 0) {
        if (isValidPair) {
          const tokenOutAmount = calculate(_tokenInAmount, undefined);
          setTokenOutAmount(tokenOutAmount && tokenOutAmount.toSignificant());
        } else {
          setTokenOutAmount(_tokenInAmount)
        }
      } else {
        setTokenOutAmount(undefined);
        setTrade(undefined);
      }
    }
  }

  const handleTokenOutAmountInput = (_tokenOutAmount: string) => {
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenOutAmount, tokenB);
    const isValidInput = (_tokenOutAmount == '') || Number(_tokenOutAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      setTokenOutAmount(_tokenOutAmount);
      if (_tokenOutAmount && isValidInput != 0) {
        if (isValidPair) {
          try {
            const tokenInAmount = calculate(undefined, _tokenOutAmount);
            setTokenInAmount(tokenInAmount && tokenInAmount.toSignificant());
          } catch (err) {

          }
        } else {
          setTokenInAmount(_tokenOutAmount);
        }
      } else {
        setTokenInAmount(undefined);
        setTrade(undefined);
      }
    }
  }

  const reverseSwapFocus = () => {
    const _tokenA = tokenB;
    const _tokenB = tokenA;
    setTokenA(_tokenA);
    setTokenB(_tokenB);
  }

  useEffect(() => {
    if (chainId) {
      dispatch(applicationUpdateSafeswapTokens({
        chainId: chainId,
        tokenA: tokenA ? SerializeToken(tokenA) : undefined,
        tokenB: tokenB ? SerializeToken(tokenB) : undefined,
      }));
      setTokenInAmount(undefined);
      setTokenOutAmount(undefined);
      setTrade(undefined);
    }
  }, [chainId, tokenA, tokenB]);

  const slippageTolerance = useSafeswapSlippageTolerance();

  const RenderRoutePath = () => {
    return <>
      {
        trade?.route.path && trade.route.path.length > 2 &&
        <Row>
          <Col span={24}>
            <Text type="secondary">{t("wallet_safeswap_route")}</Text>
          </Col>
          <Col span={24}>
            <Card style={{ marginTop: "10px" }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {
                  trade.route.path.map(token => {
                    const tokenIndex = trade.route.path.indexOf(token);
                    const isLastToken = tokenIndex == trade.route.path.length - 1;
                    return <Space style={{ flex: "1 1" }} key={token.address}>
                      <ERC20TokenLogoComponent style={{ width: "20px", height: "20px", padding: "1px" }} address={token.address} chainId={token.chainId} />
                      <Text ellipsis strong style={{ fontSize: "14px" }}>{TokenSymbol(token)}</Text>
                      {
                        !isLastToken && <RightOutlined />
                      }
                    </Space>
                  })
                }
              </div>
            </Card>
          </Col>
        </Row>
      }
    </>
  }

  const RenderPrice = () => {
    const price = trade?.executionPrice;
    return <>
      {
        price && <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text type="secondary">{t("wallet_safeswap_price")}</Text>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.toSignificant(4)}</Text> {tokenB ? TokenSymbol(tokenB) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenA ? TokenSymbol(tokenA) : "SAFE"}</Text>
            </Col>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.invert().toSignificant(4)}</Text> {tokenA ? TokenSymbol(tokenA) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenB ? TokenSymbol(tokenB) : "SAFE"}</Text>
            </Col>
          </Col>
        </Row>
      }
    </>
  }

  const RenderSlippageTolerance = () => {
    if (slippageTolerance != SafeswapV2_Default_SlippageTolerance) {
      return <>
        <Row style={{ marginTop: "15px" }}>
          <Col span={12}>
            <Text type="secondary" strong>{t("wallet_safeswap_slippageTolrance")}</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Text>{getSlippageTolerancePercent(slippageTolerance).toSignificant()}%</Text>
          </Col>
        </Row>
      </>
    }
    return <></>
  }

  const RenderTradeResult = () => {
    if (trade) {
      const tradeType = trade.tradeType;
      const slippagePercent = getSlippageTolerancePercent(slippageTolerance);
      if (tradeType == TradeType.EXACT_INPUT) {
        return <Row>
          <Col span={12}>
            <Text type="secondary">{t("wallet_safeswap_minreceived")}</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Text strong style={{ marginRight: "5px" }}>
              {trade.minimumAmountOut(slippagePercent).toSignificant()}
            </Text>
            <Text strong>
              {tokenB ? TokenSymbol(tokenB) : "SAFE"}
            </Text>
          </Col>
        </Row>
      } else if (tradeType == TradeType.EXACT_OUTPUT) {
        return <Row>
          <Col span={12}>
            <Text type="secondary">{t("wallet_safeswap_maxsold")}</Text>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Text strong style={{ marginRight: "5px" }}>
              {trade.maximumAmountIn(slippagePercent).toSignificant()}
            </Text>
            <Text strong>
              {tokenA ? TokenSymbol(tokenA) : "SAFE"}
            </Text>
          </Col>
        </Row>
      }
    }
  }

  return <>
    <Spin spinning={loading}>
      <Row>
        <Col span={24}>
          <Text type="secondary" strong>{t("wallet_safeswap_from")}</Text>
          <Text type="secondary" style={{ float: "right" }}>{t("balance_currentavailable")}:
            {balanceOfTokenA && ViewFiexdAmount(balanceOfTokenA, tokenA)}
          </Text>
        </Col>
        <Col span={16}>
          <Input placeholder="0.0" size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }} value={tokenInAmount}
            onChange={(event) => {
              handleTokenInAmountInput(event.target.value)
            }} />
        </Col>
        <Col span={8}>
          <Row style={{ marginTop: "24px" }}>
            <Col span={4}>
              {/* <div style={{ marginTop: "4px" }}>
              <Link>{t("wallet_send_max")}</Link>
              <Divider type="vertical" />
            </div> */}
            </Col>
            <Col span={20}>
              <div style={{ float: "right", paddingRight: "5px" }}>
                <TokenButtonSelect token={tokenA} tokenSelectCallback={(token: Token | undefined) => {
                  if (tokenB?.address == token?.address) {
                    reverseSwapFocus();
                  } else {
                    setTokenInAmount(undefined);
                    setTokenOutAmount(undefined);
                    setTokenA(token);
                  }
                }} />
              </div>
            </Col>
          </Row>
        </Col>
        {
          balanceOfTokenANotEnough && <Col span={24}>
            <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
              {t("wallet_safeswap_tokennotenough")}
            </>} />
          </Col>
        }
      </Row>
      <Row>
        <Col span={24}>
          <ArrowDownOutlined onClick={reverseSwapFocus} style={{ fontSize: "24px", color: "green", marginTop: "10px", marginBottom: "10px" }} />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary" strong>{t("wallet_safeswap_to")}</Text>
          <Text type="secondary" style={{ float: "right" }}>{t("balance_currentavailable")}:
            {balanceOfTokenB && ViewFiexdAmount(balanceOfTokenB, tokenB)}
          </Text>
        </Col>
        <Col span={16}>
          <Input placeholder="0.0" size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }} value={tokenOutAmount}
            onChange={(event) => {
              handleTokenOutAmountInput(event.target.value)
            }} />
        </Col>
        <Col span={8}>
          <Row style={{ marginTop: "24px" }}>
            <Col span={4}>

            </Col>
            <Col span={20}>
              <div style={{ float: "right", paddingRight: "5px" }}>
                <TokenButtonSelect token={tokenB} tokenSelectCallback={(token: Token | undefined) => {
                  if (tokenA?.address == token?.address) {
                    reverseSwapFocus();
                  } else {
                    setTokenInAmount(undefined);
                    setTokenOutAmount(undefined);
                    setTokenB(token);
                  }
                }} />
              </div>
            </Col>
          </Row>
        </Col>
        {
          reserverOfTokenBNotEnough && <Col span={24}>
            <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
              {t("wallet_safeswap_exceedsreserve")}
            </>} />
          </Col>
        }
      </Row>
      {
        RenderPrice()
      }
      <Divider />
      {
        RenderSlippageTolerance()
      }
      {
        RenderTradeResult()
      }
      {
        RenderRoutePath()
      }
      {
        liquidityNotFound && <Row style={{ marginTop: "5px" }}>
          <Col span={24}>
            <Alert style={{ width: "100%" }} type="warning" message={<Row>
              <Col span={24}>
                <Text>{t("wallet_safeswap_notfoundpair")}</Text>
                <Link onClick={() => goToAddLiquidity()} style={{ float: "right" }}>
                  {t("wallet_safeswap_addliquiditiy")}
                </Link>
              </Col>
            </Row>} />
          </Col>
        </Row>
      }
      <Divider />
      <Row>
        <Col span={24}>
          <Button disabled={
            (liquidityNotFound || balanceOfTokenANotEnough || reserverOfTokenBNotEnough)
            || (!(tokenInAmount && tokenOutAmount))
          } onClick={() => setOpenSwapConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
        </Col>
      </Row>
    </Spin>
    {
      tokenInAmount && tokenOutAmount && (trade || !isValidPair) && openSwapConfirmModal && <>
        <SwapConfirm openSwapConfirmModal={openSwapConfirmModal} setOpenSwapConfirmModal={setOpenSwapConfirmModal}
          tokenA={tokenA} tokenB={tokenB}
          tokenInAmount={tokenInAmount} tokenOutAmount={tokenOutAmount}
          trade={trade}
        />
      </>
    }
  </>
}
