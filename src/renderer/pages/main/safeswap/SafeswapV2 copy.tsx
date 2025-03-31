import { ArrowDownOutlined, DownOutlined, LeftOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { calculateAmountIn, calculateAmountOut, calculatePaireAddress, getReserve, sort } from "./Calculate";
import { useContract, useIERC20Contract } from "../../../hooks/useContracts";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useBlockNumber } from "../../../state/application/hooks";
import { useTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import { SafeswapV2RouterAddress } from "../../../config";
const { Title, Text, Link } = Typography;


const SafeswapV2_Fee_Rate = "0.003";

const enum SwapFocus {
  BuyIn = "BuyIn",
  SellOut = "SellOut",
}

const enum PriceType {
  A2B = "A2B",
  B2A = "B2A"
}

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();
  const Default_Swap_Token = chainId && [
    // USDT[chainId as Safe4NetworkChainId],
    new Token(ChainId.MAINNET, "0xC5a68f24aD442801c454417e9F5aE073DD9D92F6", 18, "TKA", "Token-A"),
    // new Token(ChainId.MAINNET, "0xb9FE8cBC71B818035AcCfd621d204BAa57377FFA", 18, "TKB", "Token-B")
    undefined,
  ];

  const tokens = useTokens();
  const [erc20Tokens, setERC20Tokens] = useState<Token[]>(
    Object.keys(tokens).map((address) => {
      const { name, decimals, symbol } = tokens[address];
      return new Token(ChainId.MAINNET, address, decimals, symbol, name);
    })
  );
  const tokenAmounts = useTokenBalances(activeAccount, erc20Tokens);
  const tokenAllowanceAmounts = useTokenAllowanceAmounts(activeAccount, SafeswapV2RouterAddress, erc20Tokens);

  const balance = useETHBalances([activeAccount])[activeAccount];
  const [tokenA, setTokenA] = useState<Token | undefined>(Default_Swap_Token ? Default_Swap_Token[0] : undefined);
  const [tokenB, setTokenB] = useState<Token | undefined>(Default_Swap_Token ? Default_Swap_Token[1] : undefined);
  const [swapFocus, setSwapFocus] = useState<SwapFocus | undefined>(undefined);
  const [priceType, setPriceType] = useState<PriceType | undefined>(PriceType.B2A);
  const balanceOfTokenA = tokenA ? tokenAmounts[tokenA.address] : balance;
  const balanceOfTokenB = tokenB ? tokenAmounts[tokenB.address] : balance;
  const [reservers, setReservers] = useState<{ [address: string]: any }>();
  const [tokenInAmount, setTokenInAmount] = useState<string>();
  const [tokenOutAmount, setTokenOutAmount] = useState<string>();
  const pairAddress = chainId && calculatePaireAddress(tokenA, tokenB, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const tokenAContract = tokenA && useIERC20Contract(tokenA.address, true);
  const [err, setErr] = useState<{
    liquidity?: string | undefined
  }>();
  const [approveTokenHash, setApproveTokenHash] = useState<{
    [address: string]: {
      execute : boolean,
      hash ?: string
    }
  }>({});

  // const allowanceForRouterOfTokenA = useMemo(() => {
  //   return tokenA ? tokenAllowanceAmounts[tokenA.address] : undefined;
  // }, [tokenA, tokenAllowanceAmounts]);

  // const needApproveTokenA = useMemo(() => {
  //   // if (tokenA && tokenInAmount && allowanceForRouterOfTokenA) {
  //   //   const inAmount = new TokenAmount(tokenA, tokenInAmount);
  //   //   return inAmount.greaterThan(allowanceForRouterOfTokenA)
  //   // }
  //   return true;
  // }, [allowanceForRouterOfTokenA, tokenInAmount])

  useEffect(() => {
    if (pairContract) {
      setReservers(undefined);
      setErr(undefined);
      pairContract.getReserves().then((data: any) => {
        const [r0, r1] = data;
        const sortTokens = sort(tokenA, tokenB, chainId);
        if (sortTokens) {
          const reservers: { [address: string]: any } = {};
          reservers[sortTokens[0].address] = r0;
          reservers[sortTokens[1].address] = r1;
          setReservers(reservers);
          if (swapFocus && swapFocus == SwapFocus.SellOut && tokenInAmount) {
            calculate(tokenInAmount, undefined);
          } else if (swapFocus && swapFocus == SwapFocus.BuyIn && tokenOutAmount) {
            calculate(undefined, tokenOutAmount);
          }
        }
      }).catch((err: any) => {
        // 未创建流动性
        console.log("No liquidility");
        setErr({
          ...err,
          liquidity: "未在 Safeswap 中找到该代币组合的交易池"
        })
      })
    }
  }, [pairContract, blockNumber]);

  const calculate = useCallback((tokenInAmount: string | undefined, tokenOutAmount: string | undefined): CurrencyAmount | undefined => {
    if (chainId && reservers) {
      if (tokenInAmount) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountOut = calculateAmountOut(
          amountIn,
          reserveIn,
          reserveOut,
          SafeswapV2_Fee_Rate,
        );
        return tokenB ? new TokenAmount(tokenB, amountOut.toBigInt())
          : CurrencyAmount.ether(amountOut.toBigInt());
      } else if (tokenOutAmount) {
        const amountOut = ethers.utils.parseUnits(tokenOutAmount, tokenB?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountIn = calculateAmountIn(
          amountOut,
          reserveOut,
          reserveIn,
          SafeswapV2_Fee_Rate,
        );
        return tokenA ? new TokenAmount(tokenA, amountIn.toBigInt())
          : CurrencyAmount.ether(amountIn.toBigInt());
      }
    }
    return undefined;
  }, [chainId, reservers, tokenA, tokenB, priceType]);

  const handleTokenInAmountInput = (_tokenInAmount: string) => {
    setTokenInAmount(_tokenInAmount);
    setSwapFocus(SwapFocus.SellOut);
    const tokenOutAmount = calculate(_tokenInAmount, undefined);
    setTokenOutAmount(tokenOutAmount?.toFixed(4));
  }

  const handleTokenOutAmountInput = (_tokenOutAmount: string) => {
    setTokenOutAmount(_tokenOutAmount);
    setSwapFocus(SwapFocus.BuyIn);
    const tokenInAmount = calculate(undefined, _tokenOutAmount);
    setTokenInAmount(tokenInAmount?.toFixed(4));
  }

  const reverseSwapFocus = () => {
    const _tokenA = tokenB;
    const _tokenB = tokenA;
    setTokenA(_tokenA);
    setTokenB(_tokenB);
    setSwapFocus(undefined);
    setTokenInAmount(undefined);
    setTokenOutAmount(undefined);
  }

  const reversePriceType = () => {
    if (priceType && priceType == PriceType.A2B) {
      setPriceType(PriceType.B2A);
    } else {
      setPriceType(PriceType.A2B);
    }
  }

  const price = useMemo(() => {
    if (tokenInAmount && tokenOutAmount) {
      if (priceType == PriceType.B2A) {
        return (Number(tokenInAmount) / Number(tokenOutAmount)).toFixed(4);
      } else {
        return (Number(tokenOutAmount) / Number(tokenInAmount)).toFixed(4);
      }
    }
    return undefined;
  }, [tokenA, tokenB, tokenInAmount, tokenOutAmount, priceType]);

  const approveRouter = useCallback(() => {
    if (tokenA && activeAccount && tokenAContract) {
      setApproveTokenHash({
        ... approveTokenHash,
        [tokenA.address] : {
          execute:true
        }
      })
      tokenAContract.approve(SafeswapV2RouterAddress, ethers.constants.MaxUint256)
        .then((response: any) => {
          const { hash, data } = response;
          setApproveTokenHash({
            ... approveTokenHash,
            [tokenA.address] : {
              hash,
              execute:true
            }
          })
        })
    }
  }, [activeAccount, tokenA, tokenAContract])

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          互兑交易
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                使用 Safeswap 在 Safe4 网络中进行代币互兑交易
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          <Card style={{ width: "50%", margin: "auto" }}>
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>{t("wallet_crosschain_select_token")}</Text>
                <Text type="secondary" style={{ float: "right" }}>可用余额:
                  {tokenA ? balanceOfTokenA?.toFixed(tokenA.decimals > 4 ? 4 : tokenA.decimals) : balanceOfTokenA?.toFixed(4)}
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
                  <Col span={8}>
                    <div style={{ marginTop: "4px" }}>
                      <Link>{t("wallet_send_max")}</Link>
                      <Divider type="vertical" />
                    </div>
                  </Col>
                  <Col span={16} style={{ paddingRight: "5px" }}>
                    <TokenButtonSelect token={tokenA} tokenSelectCallback={(token: Token | undefined) => {
                      if (tokenB?.address == token?.address) {
                        reverseSwapFocus();
                      } else {
                        setTokenInAmount(undefined);
                        setTokenOutAmount(undefined);
                        setTokenA(token);
                      }
                    }} />
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <ArrowDownOutlined onClick={reverseSwapFocus} style={{ fontSize: "24px", color: "green", marginTop: "10px", marginBottom: "10px" }} />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>选择代币</Text>
                <Text type="secondary" style={{ float: "right" }}>可用余额:
                  {tokenB ? balanceOfTokenB?.toFixed(tokenB.decimals > 4 ? 4 : tokenB.decimals) : balanceOfTokenB?.toFixed(4)}
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
                  <Col span={8}>

                  </Col>
                  <Col span={16} style={{ paddingRight: "5px" }}>
                    <TokenButtonSelect token={tokenB} tokenSelectCallback={(token: Token | undefined) => {
                      if (tokenA?.address == token?.address) {
                        reverseSwapFocus();
                      } else {
                        setTokenInAmount(undefined);
                        setTokenOutAmount(undefined);
                        setTokenB(token);
                      }
                    }} />
                  </Col>
                </Row>
              </Col>
            </Row>
            {
              price && <Row style={{ marginTop: "5px" }}>
                <Col span={12}>
                  <SwapOutlined onClick={reversePriceType} style={{ fontSize: "14px", marginRight: "5px" }} />
                  <Text type="secondary">价格</Text>
                </Col>
                <Col span={12}>
                  <Text style={{ float: "right" }}>
                    {priceType == PriceType.A2B && <>
                      1 {tokenA ? tokenA.symbol : "SAFE"} = <Text strong>{price}</Text> {tokenB ? tokenB.symbol : "SAFE"}
                    </>}
                    {priceType == PriceType.B2A && <>
                      1 {tokenB ? tokenB.symbol : "SAFE"} = <Text strong>{price}</Text> {tokenA ? tokenA.symbol : "SAFE"}
                    </>}
                  </Text>
                </Col>
              </Row>
            }
            {
              err && <Row style={{ marginTop: "5px" }}>
                {
                  err?.liquidity && <>
                    <Alert style={{ width: "100%" }} type="warning" message={err?.liquidity} />
                  </>
                }
              </Row>
            }
            <Divider />
            <Row>
              {/* {
                needApproveTokenA && tokenA && <Col span={24}>
                  <Alert style={{ marginBottom: "10px" }} type="warning" message={<>
                    <Text>需要先授权 Safeswap 访问 {tokenA?.symbol}</Text>
                    <Link disabled={approveTokenHash[tokenA?.address]?.execute} onClick={approveRouter} style={{ float: "right" }}>
                      {
                        approveTokenHash[tokenA?.address]?.execute && <SyncOutlined spin/>
                      }
                      {
                        approveTokenHash[tokenA?.address] ?  "正在授权1..." : "点击授权"
                      }
                    </Link>
                  </>} />
                </Col>
              } */}
              <Col span={24}>
                <Button disabled type="primary" style={{ width: "100%", height: "40px" }}>兑换</Button>
              </Col>
            </Row>
          </Card>
        </Card>
      </div>
    </div>
  </>
}
