import { ArrowDownOutlined, DownOutlined, LeftOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import { calculateAmountIn, calculateAmountOut, calculatePairAddress, getReserve, sort } from "./Calculate";
import { useContract, useIERC20Contract } from "../../../hooks/useContracts";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useBlockNumber, useSafeswapTokens } from "../../../state/application/hooks";
import { useTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import { IERC20_Interface } from "../../../abis";
import SwapConfirm from "./SwapConfirm";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
const { Text, Link } = Typography;


export const SafeswapV2_Fee_Rate = "0.003";

const enum SwapFocus {
  BuyIn = "BuyIn",
  SellOut = "SellOut",
}

export enum PriceType {
  A2B = "A2B",
  B2A = "B2A"
}

export const Default_Safeswap_Tokens = (chainId: Safe4NetworkChainId) => {
  return [
    USDT[chainId],
    undefined,
    // new Token(ChainId.MAINNET, "0xC5a68f24aD442801c454417e9F5aE073DD9D92F6", 18, "TKA", "Token-A"),
    // new Token(ChainId.MAINNET, "0xb9FE8cBC71B818035AcCfd621d204BAa57377FFA", 18, "TKB", "Token-B")
  ]
}

export const Default_SlippageTolerance = "0.01"; // 1%

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

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const signer = useWalletsActiveSigner()
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();
  const dispatch = useDispatch();
  const safeswapTokens = useSafeswapTokens();
  const Default_Swap_Token = chainId && Default_Safeswap_Tokens(chainId);
  const tokens = useTokens();
  const erc20Tokens = useMemo(() => {
    if (chainId) {
      const defaultTokens = [
        USDT[chainId as Safe4NetworkChainId],
        WSAFE[chainId as Safe4NetworkChainId],
      ]
      return defaultTokens.concat(Object.keys(tokens).map((address) => {
        const { name, decimals, symbol } = tokens[address];
        return new Token(ChainId.MAINNET, address, decimals, symbol, name);
      }));
    }
  }, [chainId]);

  const tokenAmounts = erc20Tokens && useTokenBalances(activeAccount, erc20Tokens);
  const tokenAllowanceAmounts = erc20Tokens && useTokenAllowanceAmounts(activeAccount, SafeswapV2RouterAddress, erc20Tokens);
  const balance = useETHBalances([activeAccount])[activeAccount];

  const [tokenA, setTokenA] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenA) : Default_Swap_Token ? Default_Swap_Token[0] : undefined
  );
  const [tokenB, setTokenB] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenB) : Default_Swap_Token ? Default_Swap_Token[1] : undefined
  );
  const [swapFocus, setSwapFocus] = useState<SwapFocus | undefined>(undefined);
  const [priceType, setPriceType] = useState<PriceType | undefined>(PriceType.B2A);
  const balanceOfTokenA = tokenAmounts && tokenA ? tokenAmounts[tokenA.address] : balance;
  const balanceOfTokenB = tokenAmounts && tokenB ? tokenAmounts[tokenB.address] : balance;
  const [reservers, setReservers] = useState<{ [address: string]: any }>();
  const [tokenInAmount, setTokenInAmount] = useState<string>();
  const [tokenOutAmount, setTokenOutAmount] = useState<string>();
  const pairAddress = chainId && calculatePairAddress(tokenA, tokenB, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const tokenAContract = tokenA ? new Contract(tokenA.address, IERC20_Interface, signer) : undefined;
  const [openSwapConfirmModal, setOpenSwapConfirmModal] = useState<boolean>(false);

  const [liquidityNotFound, setLiquidityNotFound] = useState<boolean>(false);
  const balanceOfTokenANotEnough = useMemo(() => {
    if (tokenInAmount && balanceOfTokenA) {
      return tokenA ? new TokenAmount(tokenA, ethers.utils.parseUnits(tokenInAmount, tokenA.decimals).toBigInt()).greaterThan(balanceOfTokenA)
        : CurrencyAmount.ether(ethers.utils.parseUnits(tokenInAmount).toBigInt()).greaterThan(balanceOfTokenA)
    }
    return false;
  }, [tokenA, balanceOfTokenA, tokenInAmount]);
  const reserverOfTokenBNotEnough = useMemo(() => {
    if (tokenOutAmount && chainId && reservers) {
      const reserveB = getReserve(tokenB, reservers, chainId);
      const tokenOut = ethers.utils.parseUnits(tokenOutAmount, tokenB?.decimals);
      return tokenOut.gt(reserveB);
    }
  }, [tokenB, reservers, tokenOutAmount, chainId])

  const [approveTokenHash, setApproveTokenHash] = useState<{
    [address: string]: {
      execute: boolean,
      hash?: string
    }
  }>({});

  const allowanceForRouterOfTokenA = useMemo(() => {
    return tokenAllowanceAmounts && tokenA ? tokenAllowanceAmounts[tokenA.address] : undefined;
  }, [tokenA, tokenAllowanceAmounts]);

  const needApproveTokenA = useMemo(() => {
    if (tokenA && tokenInAmount && allowanceForRouterOfTokenA) {
      const inAmount = new TokenAmount(tokenA, ethers.utils.parseUnits(tokenInAmount, tokenA.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenA)
    }
    return false;
  }, [allowanceForRouterOfTokenA, tokenInAmount]);

  useEffect(() => {
    if (pairContract && !openSwapConfirmModal) {
      setReservers(undefined);
      setLiquidityNotFound(false);
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
        setLiquidityNotFound(true);
      })
    }
  }, [pairContract, blockNumber, openSwapConfirmModal]);

  const approveRouter = useCallback(() => {
    if (tokenA && activeAccount && tokenAContract) {
      setApproveTokenHash({
        ...approveTokenHash,
        [tokenA.address]: {
          execute: true
        }
      })
      tokenAContract.approve(SafeswapV2RouterAddress, ethers.constants.MaxUint256)
        .then((response: any) => {
          const { hash, data } = response;
          setApproveTokenHash({
            ...approveTokenHash,
            [tokenA.address]: {
              hash,
              execute: true
            }
          })
        })
    }
  }, [activeAccount, tokenA, tokenAContract])

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
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenInAmount, tokenA);
    const isValidInput = (_tokenInAmount == '') || Number(_tokenInAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      setTokenInAmount(_tokenInAmount);
      setSwapFocus(SwapFocus.SellOut);
      if (_tokenInAmount && isValidInput != 0) {
        const tokenOutAmount = calculate(_tokenInAmount, undefined);
        setTokenOutAmount(tokenOutAmount && ViewFiexdAmount(tokenOutAmount, tokenB, 6));
      } else {
        setTokenOutAmount(undefined);
      }
    }
  }

  const handleTokenOutAmountInput = (_tokenOutAmount: string) => {
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenOutAmount, tokenB);
    const isValidInput = (_tokenOutAmount == '') || Number(_tokenOutAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      setTokenOutAmount(_tokenOutAmount);
      setSwapFocus(SwapFocus.BuyIn);
      if (_tokenOutAmount && isValidInput != 0) {
        try {
          const tokenInAmount = calculate(undefined, _tokenOutAmount);
          setTokenInAmount(tokenInAmount && ViewFiexdAmount(tokenInAmount, tokenA, 6));
        } catch (err) {

        }
      } else {
        setTokenInAmount(undefined);
      }
    }
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

  const price = useMemo(() => {
    if (tokenInAmount && tokenOutAmount) {
      return {
        [PriceType.B2A]: (Number(tokenInAmount) / Number(tokenOutAmount)) ? (Number(tokenInAmount) / Number(tokenOutAmount)).toFixed(4) : undefined,
        [PriceType.A2B]: (Number(tokenOutAmount) / Number(tokenInAmount)) ? (Number(tokenOutAmount) / Number(tokenInAmount)).toFixed(4) : undefined
      }
    }
    return undefined;
  }, [tokenA, tokenB, tokenInAmount, tokenOutAmount, priceType]);

  useEffect(() => {
    dispatch(applicationUpdateSafeswapTokens({
      tokenA: tokenA ? SerializeToken(tokenA) : undefined,
      tokenB: tokenB ? SerializeToken(tokenB) : undefined,
    }));
  }, [tokenA, tokenB])

  return <>
    <Row>
      <Col span={24}>
        <Text type="secondary" strong>{t("wallet_crosschain_select_token")}</Text>
        <Text type="secondary" style={{ float: "right" }}>可用余额:
          {balanceOfTokenA && ViewFiexdAmount(balanceOfTokenA, tokenA, 4)}
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
            账户可用余额不足
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
        <Text type="secondary" strong>选择代币</Text>
        <Text type="secondary" style={{ float: "right" }}>可用余额:
          {balanceOfTokenB && ViewFiexdAmount(balanceOfTokenB, tokenB, 4)}
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
            超过该交易池库存
          </>} />
        </Col>
      }
    </Row>
    {
      price && price[PriceType.A2B] && price[PriceType.B2A] && <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text type="secondary">价格</Text>
        </Col>
        <Col span={12}>
          <Col span={24} style={{ textAlign: "center" }}>
            <Text strong>{price[PriceType.A2B]}</Text> {tokenB ? tokenB.symbol : "SAFE"}
          </Col>
          <Col span={24} style={{ textAlign: "center" }}>
            <Text>1 {tokenA ? tokenA.symbol : "SAFE"}</Text>
          </Col>
        </Col>
        <Col span={12}>
          <Col span={24} style={{ textAlign: "center" }}>
            <Text strong>{price[PriceType.B2A]}</Text> {tokenA ? tokenA.symbol : "SAFE"}
          </Col>
          <Col span={24} style={{ textAlign: "center" }}>
            <Text>1 {tokenB ? tokenB.symbol : "SAFE"}</Text>
          </Col>
        </Col>
      </Row>
    }
    {
      liquidityNotFound && <Row style={{ marginTop: "5px" }}>
        <Col span={24}>
          <Alert style={{ width: "100%" }} type="warning" message={"未在 Safeswap 中找到该交易池"} />
        </Col>
      </Row>
    }
    {
      needApproveTokenA && tokenA && reservers && <Col span={24}>
        <Alert style={{ marginBottom: "10px" }} type="warning" message={<>
          <Text>需要先授权 Safeswap 访问 {tokenA?.symbol}</Text>
          <Link disabled={approveTokenHash[tokenA?.address]?.execute} onClick={approveRouter} style={{ float: "right" }}>
            {
              approveTokenHash[tokenA?.address]?.execute && <SyncOutlined spin />
            }
            {
              approveTokenHash[tokenA?.address] ? "正在授权..." : "点击授权"
            }
          </Link>
        </>} />
      </Col>
    }
    <Divider />

    <Row>
      <Col span={24}>
        <Button disabled={
          (liquidityNotFound || balanceOfTokenANotEnough || reserverOfTokenBNotEnough || needApproveTokenA)
          || (!(tokenInAmount && tokenOutAmount))
        } onClick={() => setOpenSwapConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
      </Col>
    </Row>

    {
      tokenInAmount && tokenOutAmount && reservers && <>
        <SwapConfirm openSwapConfirmModal={openSwapConfirmModal}
          setOpenSwapConfirmModal={setOpenSwapConfirmModal}
          tokenA={tokenA} tokenB={tokenB}
          tokenInAmount={tokenInAmount} tokenOutAmount={tokenOutAmount}
          reservers={reservers} />
      </>
    }
  </>
}
