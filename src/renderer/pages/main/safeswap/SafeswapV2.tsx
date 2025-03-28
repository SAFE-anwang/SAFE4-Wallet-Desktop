import { ArrowDownOutlined, DownOutlined, LeftOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import { useETHBalances, useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import TokenSelectModal from "./TokenSelectModal";
import { calculateAmountIn, calculateAmountOut, calculatePaireAddress, getReserve, sort } from "./Calculate";
import { useContract } from "../../../hooks/useContracts";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useBlockNumber } from "../../../state/application/hooks";
import { SAFE_LOGO } from "../../../assets/logo/AssetsLogo";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import EtherAmount from "../../../utils/EtherAmount";
const { Title, Text, Link } = Typography;


const SafeswapV2_Fee_Rate = "0.003";

const enum SwapFocus {
  BuyIn = "BuyIn",
  SellOut = "SellOut",
}

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();

  const Default_Swap_Token = chainId && [
    // USDT[chainId as Safe4NetworkChainId],
    new Token(ChainId.MAINNET, "0xC5a68f24aD442801c454417e9F5aE073DD9D92F6", 18, "TKA", "Token-A"),
    // new Token(ChainId.MAINNET,"0xb9FE8cBC71B818035AcCfd621d204BAa57377FFA",18,"TKB","Token-B")
    undefined,
  ];

  const swapParams: {
    tokenA : Token | undefined,
    tokenB : Token | undefined,
    tokenInAmount : string | undefined,
    tokenOutAmount : string | undefined,
    swapFocus : SwapFocus | undefined
  } | undefined = undefined;

  const [tokenA, setTokenA] = useState<Token | undefined>(Default_Swap_Token ? Default_Swap_Token[0] : undefined);
  const [tokenB, setTokenB] = useState<Token | undefined>(Default_Swap_Token ? Default_Swap_Token[1] : undefined);
  const pairAddress = chainId && calculatePaireAddress(tokenA, tokenB, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const [reservers, setReservers] = useState<{ [address: string]: any }>();

  useEffect(() => {
    if (pairContract) {
      pairContract.getReserves().then((data: any) => {
        const [r0, r1] = data;
        const sortTokens = sort(tokenA, tokenB, chainId);
        if (sortTokens) {
          const reservers: { [address: string]: any } = {};
          reservers[sortTokens[0].address] = r0;
          reservers[sortTokens[1].address] = r1;
          setReservers(reservers);
        }
      }).catch((err: any) => {
        // 未创建流动性
      })
    }
  }, [pairContract, blockNumber]);

  const [tokenInAmount, setTokenInAmount] = useState<string>();
  const [tokenOutAmount, setTokenOutAmount] = useState<string>();
  const [swapFocus, setSwapFocus] = useState<SwapFocus | undefined>();

  const handleTokenInAmountInput = (_tokenInAmount: string) => {
    setTokenInAmount(_tokenInAmount)
    setSwapFocus(SwapFocus.SellOut);
  }

  const handleTokenOutAmountInput = (_tokenOutAmount: string) => {
    setTokenOutAmount(_tokenOutAmount)
    setSwapFocus(SwapFocus.BuyIn);
  }

  // const handleTokenAmountCalculate = useCallback((tokenInAmount: string | undefined, tokenOutAmount: string | undefined) => {
  //   if (chainId) {
  //     if (tokenInAmount) {
  //       const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA?.decimals);
  //       const reserveIn = getReserve(tokenA, reservers, chainId);
  //       const reserveOut = getReserve(tokenB, reservers, chainId);
  //       const amountOut = calculateAmountOut(
  //         amountIn,
  //         reserveIn,
  //         reserveOut,
  //         SafeswapV2_Fee_Rate,
  //       );
  //       const tokenOutAmount = tokenB ? new TokenAmount(tokenB, amountOut.toBigInt())
  //         : CurrencyAmount.ether(amountOut.toBigInt());
  //       setTokenOutAmount(tokenOutAmount.toFixed(4));
  //       return;
  //     } else if (tokenOutAmount) {
  //       const amountOut = ethers.utils.parseUnits(tokenOutAmount, tokenB?.decimals);
  //       const reserveIn = getReserve(tokenA, reservers, chainId);
  //       const reserveOut = getReserve(tokenB, reservers, chainId);
  //       const amountIn = calculateAmountIn(
  //         amountOut,
  //         reserveOut,
  //         reserveIn,
  //         SafeswapV2_Fee_Rate,
  //       );
  //       const tokenInAmount = tokenA ? new TokenAmount(tokenA, amountIn.toBigInt())
  //         : CurrencyAmount.ether(amountOut.toBigInt());
  //       setTokenInAmount(tokenInAmount.toFixed(4));
  //     }
  //   }
  // }, [reservers, tokenA, tokenB]);

  useEffect(() => {
    if (chainId) {
      if (swapFocus == SwapFocus.SellOut && tokenInAmount) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountOut = calculateAmountOut(
          amountIn,
          reserveIn,
          reserveOut,
          SafeswapV2_Fee_Rate,
        );
        const tokenOutAmount = tokenB ? new TokenAmount(tokenB, amountOut.toBigInt())
          : CurrencyAmount.ether(amountOut.toBigInt());
        setTokenOutAmount(tokenOutAmount.toFixed(4));
      } else if (swapFocus == SwapFocus.BuyIn && tokenOutAmount) {
        const amountOut = ethers.utils.parseUnits(tokenOutAmount, tokenB?.decimals);
        const reserveIn = getReserve(tokenA, reservers, chainId);
        const reserveOut = getReserve(tokenB, reservers, chainId);
        const amountIn = calculateAmountIn(
          amountOut,
          reserveOut,
          reserveIn,
          SafeswapV2_Fee_Rate,
        );
        const tokenInAmount = tokenA ? new TokenAmount(tokenA, amountIn.toBigInt())
          : CurrencyAmount.ether(amountOut.toBigInt());
        setTokenInAmount(tokenInAmount.toFixed(4));
      }
    }
  }, [reservers, tokenA, tokenB, tokenInAmount, tokenOutAmount, swapFocus, chainId]);

  const RenderTokenA_Button = () => {
    if (chainId) {
      if (tokenA) {
        return <Button style={{ height: "32px", width: "100%" }} size="small" type="text"
          icon={<ERC20TokenLogoComponent style={{
            padding: "4px", width: "32px", height: "32px", background: "#efefef"
          }} address={tokenA.address} chainId={chainId} />}>
          {tokenA.symbol}
          <DownOutlined />
        </Button>
      } else {
        return <Button style={{ height: "32px", width: "100%" }} size="small" type="text" icon={<TokenLogo />}>
          SAFE
          <DownOutlined />
        </Button>
      }
    }
  }

  const RenderTokenB_Button = () => {
    if (chainId) {
      if (tokenB) {
        return <Button style={{ height: "32px", width: "100%" }} size="small" type="text"
          icon={<ERC20TokenLogoComponent style={{
            padding: "4px", width: "32px", height: "32px", background: "#efefef"
          }} address={tokenB.address} chainId={chainId} />}>
          {tokenB.symbol}
          <DownOutlined />
        </Button>
      } else {
        return <Button style={{ height: "32px", width: "100%" }} size="small" type="text" icon={<TokenLogo />}>
          SAFE
          <DownOutlined />
        </Button>
      }
    }
  }

  const reverseSwapFocus = () => {
    const _tokenA = tokenB;
    const _tokenB = tokenA;
    setTokenA(_tokenA);
    setTokenB(_tokenB);
    if (swapFocus) {
      if (swapFocus == SwapFocus.SellOut) {
        setTokenOutAmount(tokenInAmount);
      } else if (swapFocus == SwapFocus.BuyIn) {
        setTokenInAmount(tokenOutAmount);
      }
      setSwapFocus(swapFocus == SwapFocus.BuyIn ? SwapFocus.SellOut : SwapFocus.BuyIn);
    }
  }

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
                    {RenderTokenA_Button()}
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
                    {RenderTokenB_Button()}
                  </Col>
                </Row>
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col span={24}>
                <Button type="primary" style={{ float: "right" }}>{t("next")}</Button>
              </Col>
            </Row>
          </Card>
        </Card>
      </div>
    </div>

    <TokenSelectModal />

  </>
}
