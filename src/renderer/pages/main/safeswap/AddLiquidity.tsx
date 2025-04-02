import { ArrowDownOutlined, DownOutlined, LeftOutlined, PlusOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import { calculateAmountAdd, calculateAmountIn, calculateAmountOut, calculatePaireAddress, getReserve, sort } from "./Calculate";
import { useContract, useIERC20Contract } from "../../../hooks/useContracts";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useBlockNumber } from "../../../state/application/hooks";
import { useTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import { SafeswapV2RouterAddress } from "../../../config";
import { IERC20_Interface } from "../../../abis";
import AddLiquidityConfirm from "./AddLiquidityConfirm";
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
  const signer = useWalletsActiveSigner()
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();

  const Default_Swap_Token = chainId && [
    // USDT[chainId as Safe4NetworkChainId],
    // undefined,
    new Token(ChainId.MAINNET, "0xC5a68f24aD442801c454417e9F5aE073DD9D92F6", 18, "TKA", "Token-A"),
    new Token(ChainId.MAINNET, "0x6AE363f8497E4272f19b9d2923DaF5Bb7812ca61", 18, "Hello", "Hello")
  ];

  const tokens = useTokens();
  const erc20Tokens = Object.keys(tokens).map((address) => {
    const { name, decimals, symbol } = tokens[address];
    return new Token(ChainId.MAINNET, address, decimals, symbol, name);
  })
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
  const [tokenAAmount, settokenAAmount] = useState<string>();
  const [tokenBAmount, settokenBAmount] = useState<string>();
  const pairAddress = chainId && calculatePaireAddress(tokenA, tokenB, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const tokenAContract = tokenA ? new Contract(tokenA.address, IERC20_Interface, signer) : undefined;
  const tokenBContract = tokenB ? new Contract(tokenB.address, IERC20_Interface, signer) : undefined;

  const [openAddConfirmModal, setOpenAddConfirmModal] = useState<boolean>(false);

  const [liquidityNotFound, setLiquidityNotFound] = useState<boolean>(false);
  const balanceOfTokenANotEnough = useMemo(() => {
    if (tokenAAmount && balanceOfTokenA) {
      return tokenA ? new TokenAmount(tokenA, ethers.utils.parseUnits(tokenAAmount, tokenA.decimals).toBigInt()).greaterThan(balanceOfTokenA)
        : CurrencyAmount.ether(ethers.utils.parseUnits(tokenAAmount).toBigInt()).greaterThan(balanceOfTokenA)
    }
    return false;
  }, [tokenA, balanceOfTokenA, tokenAAmount]);
  const balanceOfTokenBNotEnough = useMemo(() => {
    if (tokenBAmount && balanceOfTokenB) {
      return tokenB ? new TokenAmount(tokenB, ethers.utils.parseUnits(tokenBAmount, tokenB.decimals).toBigInt()).greaterThan(balanceOfTokenB)
        : CurrencyAmount.ether(ethers.utils.parseUnits(tokenBAmount).toBigInt()).greaterThan(balanceOfTokenB)
    }
    return false;
  }, [tokenB, balanceOfTokenB, tokenAAmount])

  const [approveTokenHash, setApproveTokenHash] = useState<{
    [address: string]: {
      execute: boolean,
      hash?: string
    }
  }>({});

  const allowanceForRouterOfTokenA = useMemo(() => {
    return tokenA ? tokenAllowanceAmounts[tokenA.address] : undefined;
  }, [tokenA, tokenAllowanceAmounts]);
  const allowanceForRouterOfTokenB = useMemo(() => {
    return tokenB ? tokenAllowanceAmounts[tokenB.address] : undefined;
  }, [tokenB, tokenAllowanceAmounts]);

  const needApproveTokenA = useMemo(() => {
    if (tokenA && tokenAAmount && allowanceForRouterOfTokenA) {
      const inAmount = new TokenAmount(tokenA, ethers.utils.parseUnits(tokenAAmount, tokenA.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenA)
    }
    return false;
  }, [allowanceForRouterOfTokenA, tokenAAmount]);
  const needApproveTokenB = useMemo(() => {
    if (tokenB && tokenBAmount && allowanceForRouterOfTokenB) {
      const inAmount = new TokenAmount(tokenB, ethers.utils.parseUnits(tokenBAmount, tokenB.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenB)
    }
    return false;
  }, [allowanceForRouterOfTokenB, tokenBAmount]);

  useEffect(() => {
    if (pairContract) {
      setReservers(undefined);
      pairContract.getReserves().then((data: any) => {
        const [r0, r1] = data;
        const sortTokens = sort(tokenA, tokenB, chainId);
        if (sortTokens) {
          const reservers: { [address: string]: any } = {};
          reservers[sortTokens[0].address] = r0;
          reservers[sortTokens[1].address] = r1;
          setReservers(reservers);
          setLiquidityNotFound(false);
          if (swapFocus && swapFocus == SwapFocus.SellOut && tokenAAmount) {
            calculate(tokenAAmount, undefined);
          } else if (swapFocus && swapFocus == SwapFocus.BuyIn && tokenBAmount) {
            calculate(undefined, tokenBAmount);
          }
        }
      }).catch((err: any) => {
        // 未创建流动性
        setLiquidityNotFound(true);
      })
    }
  }, [pairContract, blockNumber]);

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
  }, [activeAccount, tokenA, tokenAContract]);

  const approveRouterForTokenB = useCallback(() => {
    if (tokenB && activeAccount && tokenBContract) {
      setApproveTokenHash({
        ...approveTokenHash,
        [tokenB.address]: {
          execute: true
        }
      })
      tokenBContract.approve(SafeswapV2RouterAddress, ethers.constants.MaxUint256)
        .then((response: any) => {
          const { hash, data } = response;
          setApproveTokenHash({
            ...approveTokenHash,
            [tokenB.address]: {
              hash,
              execute: true
            }
          })
        })
    }
  }, [activeAccount, tokenB, tokenBContract]);

  const calculate = useCallback((tokenAAmount: string | undefined, tokenBAmount: string | undefined): CurrencyAmount | undefined => {
    if (chainId && reservers) {
      if (tokenAAmount) {
        const amountIn = ethers.utils.parseUnits(tokenAAmount, tokenA?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountAdd = calculateAmountAdd(
          amountIn,
          reserveIn,
          reserveOut,
        );
        return tokenB ? new TokenAmount(tokenB, amountAdd.toBigInt())
          : CurrencyAmount.ether(amountAdd.toBigInt());
      } else if (tokenBAmount) {
        const amountOut = ethers.utils.parseUnits(tokenBAmount, tokenB?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountIn = calculateAmountAdd(
          amountOut,
          reserveOut,
          reserveIn,
        );
        return tokenA ? new TokenAmount(tokenA, amountIn.toBigInt())
          : CurrencyAmount.ether(amountIn.toBigInt());
      }
    }
    return undefined;
  }, [chainId, reservers, tokenA, tokenB, priceType]);

  const handletokenAAmountInput = (_tokenAAmount: string) => {
    const isValidInput = (_tokenAAmount == '') || Number(_tokenAAmount);
    if (isValidInput) {
      settokenAAmount(_tokenAAmount);
      setSwapFocus(SwapFocus.SellOut);
      if (reservers) {
        const tokenBAmount = calculate(_tokenAAmount, undefined);
        settokenBAmount(tokenB ? tokenBAmount?.toFixed(tokenB.decimals > 4 ? 4 : tokenB.decimals) : tokenBAmount?.toFixed(4));
      }
    }
  }

  const handletokenBAmountInput = (_tokenBAmount: string) => {
    const isValidInput = (_tokenBAmount == '') || Number(_tokenBAmount);
    if (isValidInput) {
      settokenBAmount(_tokenBAmount);
      setSwapFocus(SwapFocus.BuyIn);
      if (reservers) {
        const tokenAAmount = calculate(undefined, _tokenBAmount);
        settokenAAmount(tokenA ? tokenAAmount?.toFixed(tokenA.decimals > 4 ? 4 : tokenA.decimals) : tokenAAmount?.toFixed(4));
      }
    }
  }

  const reverseSwapFocus = () => {
    const _tokenA = tokenB;
    const _tokenB = tokenA;
    setTokenA(_tokenA);
    setTokenB(_tokenB);
    setSwapFocus(undefined);
    settokenAAmount(undefined);
    settokenBAmount(undefined);
  }
  const reversePriceType = () => {
    if (priceType && priceType == PriceType.A2B) {
      setPriceType(PriceType.B2A);
    } else {
      setPriceType(PriceType.A2B);
    }
  }

  const price = useMemo(() => {
    if (tokenAAmount && tokenBAmount) {
      return {
        [PriceType.B2A]: (Number(tokenAAmount) / Number(tokenBAmount)).toFixed(4),
        [PriceType.A2B]: (Number(tokenBAmount) / Number(tokenAAmount)).toFixed(4)
      }
    }
    return undefined;
  }, [tokenAAmount, tokenBAmount]);

  return <>
    {
      liquidityNotFound && <Row>
        <Col span={24}>
          <Alert style={{ marginBottom: "20px" }} type="info" showIcon message={<>
            <Text strong>您将是第一个该资金池的供应者</Text>
            <br />
            <Text>初始添加代币的数量将决定这个资金池内代币的价格</Text>
          </>} />
        </Col>
      </Row>
    }
    <Row>
      <Col span={24}>
        <Text type="secondary" strong>存入</Text>
        <Text type="secondary" style={{ float: "right" }}>可用余额:
          {tokenA ? balanceOfTokenA?.toFixed(tokenA.decimals > 4 ? 4 : tokenA.decimals) : balanceOfTokenA?.toFixed(4)}
        </Text>
      </Col>
      <Col span={16}>
        <Input placeholder="0.0" size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }} value={tokenAAmount}
          onChange={(event) => {
            handletokenAAmountInput(event.target.value)
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
                settokenAAmount(undefined);
                settokenBAmount(undefined);
                setTokenA(token);
              }
            }} />
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
      <Col span={24} style={{ textAlign: "center" }}>
        <PlusOutlined onClick={reverseSwapFocus} style={{ fontSize: "24px", color: "green", marginTop: "15px", marginBottom: "10px" }} />
      </Col>
    </Row>
    <Row>
      <Col span={24}>
        <Text type="secondary" strong>存入</Text>
        <Text type="secondary" style={{ float: "right" }}>可用余额:
          {tokenB ? balanceOfTokenB?.toFixed(tokenB.decimals > 4 ? 4 : tokenB.decimals) : balanceOfTokenB?.toFixed(4)}
        </Text>
      </Col>
      <Col span={16}>
        <Input placeholder="0.0" size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }} value={tokenBAmount}
          onChange={(event) => {
            handletokenBAmountInput(event.target.value)
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
                settokenAAmount(undefined);
                settokenBAmount(undefined);
                setTokenB(token);
              }
            }} />
          </Col>
        </Row>
      </Col>
      {
        balanceOfTokenBNotEnough && <Col span={24}>
          <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
            账户可用余额不足
          </>} />
        </Col>
      }
    </Row>
    {
      price && <Row style={{ marginTop: "20px" }}>
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
      needApproveTokenA && tokenA && <Col span={24}>
        <Alert style={{ marginTop : "10px" , marginBottom: "10px" }} type="warning" message={<>
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
    {
      needApproveTokenB && tokenB && <Col span={24}>
        <Alert style={{ marginTop : "10px" , marginBottom: "10px" }} type="warning" message={<>
          <Text>需要先授权 Safeswap 访问 {tokenB?.symbol}</Text>
          <Link disabled={approveTokenHash[tokenB?.address]?.execute} onClick={approveRouterForTokenB} style={{ float: "right" }}>
            {
              approveTokenHash[tokenB?.address]?.execute && <SyncOutlined spin />
            }
            {
              approveTokenHash[tokenB?.address] ? "正在授权..." : "点击授权"
            }
          </Link>
        </>} />
      </Col>
    }
    <Divider />
    <Row>
      <Col span={24}>
        <Button disabled={
          (balanceOfTokenANotEnough || needApproveTokenA || balanceOfTokenBNotEnough || needApproveTokenB)
        } onClick={() => setOpenAddConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
      </Col>
    </Row>
    {
      tokenAAmount && tokenBAmount && <>
        <AddLiquidityConfirm openAddConfirmModal={openAddConfirmModal} setOpenAddConfirmModal={setOpenAddConfirmModal}
          tokenA={tokenA} tokenB={tokenB} tokenAAmount={tokenAAmount} tokenBAmount={tokenBAmount} />
      </>
    }
  </>
}
