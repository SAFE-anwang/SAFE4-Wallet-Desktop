import { ArrowDownOutlined, DownOutlined, LeftOutlined, PlusOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { calculateAmountAdd, calculateAmountIn, calculateAmountOut, calculatePairAddress, getReserve, sort } from "./Calculate";
import { useSafeswapTokens } from "../../../state/application/hooks";
import { useTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import AddLiquidityConfirm from "./AddLiquidityConfirm";
import { Default_Safeswap_Tokens, isDecimalPrecisionExceeded, parseTokenData, SerializeToken } from "./Swap";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import { AssetPoolModule } from "./AssetPool";
import { SafeswapV2Pairs, useSafeswapV2Pairs, useSafeswapWalletTokens } from "./hooks";
import TokenSymbol from "../../components/TokenSymbol";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
const { Text, Link } = Typography;


export default ({
  setAssetPoolModule,
  safeswapV2Pairs
}: {
  setAssetPoolModule: (assetPoolModule: AssetPoolModule) => void,
  safeswapV2Pairs: SafeswapV2Pairs
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const dispatch = useDispatch();
  const safeswapTokens = useSafeswapTokens();
  const Default_Swap_Token = chainId && Default_Safeswap_Tokens(chainId);
  const tokenAmounts = useTokenBalances(activeAccount, useSafeswapWalletTokens(false));
  const balance = useETHBalances([activeAccount])[activeAccount];
  const [tokenA, setTokenA] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenA) : Default_Swap_Token ? Default_Swap_Token[0] : undefined
  );
  const [tokenB, setTokenB] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenB) : Default_Swap_Token ? Default_Swap_Token[1] : undefined
  );
  const pairAddress = chainId && calculatePairAddress(tokenA, tokenB, chainId);
  const isValidPair = pairAddress != undefined;
  const { loading, result } = safeswapV2Pairs;
  const pairsMap = result && result.pairsMap;
  const pairBalancesMap = result && result.pairBalancesMap;
  const pairTotalSuppliesMap = result && result.pairTotalSuppliesMap;
  const pair = pairsMap && pairAddress && pairsMap[pairAddress];
  const liquidityNotFound = !loading && pairsMap && !pair && isValidPair;
  const balanceOfTokenA = tokenA ? tokenAmounts[tokenA.address] : balance;
  const balanceOfTokenB = tokenB ? tokenAmounts[tokenB.address] : balance;
  const [tokenAAmount, settokenAAmount] = useState<string>();
  const [tokenBAmount, settokenBAmount] = useState<string>();
  const [openAddConfirmModal, setOpenAddConfirmModal] = useState<boolean>(false);
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

  const calculate = useCallback((tokenAAmount: string | undefined, tokenBAmount: string | undefined): CurrencyAmount | undefined => {
    if (chainId && pair) {
      const _reserves = {
        [pair.token0.address]: ethers.BigNumber.from(pair.reserve0.raw.toString()),
        [pair.token1.address]: ethers.BigNumber.from(pair.reserve1.raw.toString())
      }
      const _reserveA = getReserve(tokenA, _reserves, chainId);
      const _reserveB = getReserve(tokenB, _reserves, chainId);
      if (tokenAAmount) {
        const amountA = ethers.utils.parseUnits(tokenAAmount, tokenA?.decimals);
        const _amountAdd = calculateAmountAdd(
          amountA,
          _reserveA,
          _reserveB,
        );
        const _amountTokenBAdd = tokenB ? new TokenAmount(tokenB, _amountAdd.toBigInt())
          : CurrencyAmount.ether(_amountAdd.toBigInt());
        return _amountTokenBAdd;
      } else if (tokenBAmount) {
        const amountB = ethers.utils.parseUnits(tokenBAmount, tokenA?.decimals);
        const _amountAdd = calculateAmountAdd(
          amountB,
          _reserveB,
          _reserveA,
        );
        const _amountTokenAAdd = tokenA ? new TokenAmount(tokenA, _amountAdd.toBigInt())
          : CurrencyAmount.ether(_amountAdd.toBigInt());
        return _amountTokenAAdd;
      }
    }
    return undefined;
  }, [chainId, tokenA, tokenB, pair]);

  const handletokenAAmountInput = (_tokenAAmount: string) => {
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenAAmount, tokenA);
    const isValidInput = (_tokenAAmount == '') || Number(_tokenAAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      settokenAAmount(_tokenAAmount);
      if (_tokenAAmount && isValidInput != 0 && pair) {
        const tokenBAmount = calculate(_tokenAAmount, undefined);
        settokenBAmount(tokenBAmount && tokenBAmount.toSignificant());
      }
    }
  }

  const handletokenBAmountInput = (_tokenBAmount: string) => {
    const decimalExceeded = isDecimalPrecisionExceeded(_tokenBAmount, tokenB);
    const isValidInput = (_tokenBAmount == '') || Number(_tokenBAmount);
    if (!decimalExceeded && (isValidInput || isValidInput == 0)) {
      settokenBAmount(_tokenBAmount);
      if (_tokenBAmount && isValidInput != 0 && pair) {
        const tokenAAmount = calculate(undefined, _tokenBAmount);
        settokenAAmount(tokenAAmount && tokenAAmount.toSignificant());
      }
    }
  }

  const reverseSwapFocus = () => {
    const _tokenA = tokenB;
    const _tokenB = tokenA;
    setTokenA(_tokenA);
    setTokenB(_tokenB);
    settokenAAmount(undefined);
    settokenBAmount(undefined);
  }


  useEffect(() => {
    if (chainId) {
      dispatch(applicationUpdateSafeswapTokens({
        chainId,
        tokenA: tokenA ? SerializeToken(tokenA) : undefined,
        tokenB: tokenB ? SerializeToken(tokenB) : undefined,
      }));
    }
  }, [tokenA, tokenB, chainId])

  const RenderPrice = () => {
    if (chainId && pair) {
      const sorkTokens = sort(tokenA, tokenB, chainId);
      if (sorkTokens) {
        const [token0, token1] = sorkTokens;
        const tokenAPrice = token0 && token0.address == pair.token0.address ? pair.token0Price : pair.token1Price;
        const tokenBPrice = token1 && token1.address == pair.token1.address ? pair.token1Price : pair.token0Price;
        return <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text type="secondary">{t("wallet_safeswap_price")}</Text>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{tokenAPrice.toSignificant(4)}</Text> {tokenB ? TokenSymbol(tokenB) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenA ? TokenSymbol(tokenA) : "SAFE"}</Text>
            </Col>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{tokenBPrice.toSignificant(4)}</Text> {tokenA ? TokenSymbol(tokenA) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenB ? TokenSymbol(tokenB) : "SAFE"}</Text>
            </Col>
          </Col>
        </Row>
      }
    }
    return <></>
  }

  return <>
    <Row>
      <Divider style={{ marginTop: "0px", marginBottom: "20px" }} />
      <Col span={24} style={{ textAlign: "center" }}>
        <LeftOutlined onClick={() => {
          setAssetPoolModule(AssetPoolModule.List);
        }} style={{ float: "left", fontSize: "20px" }} />
        <Text style={{ width: "100%", fontSize: "20px", lineHeight: "20px" }}>
          {t("wallet_safeswap_addliquiditiy")}
        </Text>
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
    </Row>
    <Spin spinning={loading}>
      {
        liquidityNotFound && <Row>
          <Col span={24}>
            <Alert style={{ marginBottom: "20px" }} type="info" showIcon message={<>
              <Text strong>{t("wallet_safeswap_liquidity_firstadd")}</Text>
              <br />
              <Text>{t("wallet_safeswap_liquidity_firstaddtip")}</Text>
            </>} />
          </Col>
        </Row>
      }
      {
        !isValidPair && <Row>
          <Col span={24}>
            <Alert style={{ marginBottom: "20px" }} type="error" showIcon message={<>
              <Text strong>{t("wallet_safeswap_liquidity_invalidpair")}</Text>
            </>} />
          </Col>
        </Row>
      }
      <Row>
        <Col span={24}>
          <Text type="secondary" strong>{t("wallet_safeswap_addreserve")}</Text>
          <Text type="secondary" style={{ float: "right" }}>{t("balance_currentavailable")}:
            {balanceOfTokenA && ViewFiexdAmount(balanceOfTokenA, tokenA)}
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
                    settokenAAmount(undefined);
                    settokenBAmount(undefined);
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
        <Col span={24} style={{ textAlign: "center" }}>
          <PlusOutlined style={{ fontSize: "24px", color: "green", marginTop: "15px", marginBottom: "10px" }} />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary" strong>{t("wallet_safeswap_addreserve")}</Text>
          <Text type="secondary" style={{ float: "right" }}>{t("balance_currentavailable")}:
            {balanceOfTokenB && ViewFiexdAmount(balanceOfTokenB, tokenB)}
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
            <Col span={4}>

            </Col>
            <Col span={20} style={{ paddingRight: "5px" }}>
              <div style={{ float: "right", paddingRight: "5px" }}>
                <TokenButtonSelect token={tokenB} tokenSelectCallback={(token: Token | undefined) => {
                  if (tokenA?.address == token?.address) {
                    reverseSwapFocus();
                  } else {
                    settokenAAmount(undefined);
                    settokenBAmount(undefined);
                    setTokenB(token);
                  }
                }} />
              </div>
            </Col>
          </Row>
        </Col>
        {
          balanceOfTokenBNotEnough && <Col span={24}>
            <Alert style={{ marginTop: "5px" }} showIcon type="error" message={<>
              {t("wallet_safeswap_tokennotenough")}
            </>} />
          </Col>
        }
      </Row>
      {
        RenderPrice()
      }
      <Divider />
      <Row>
        <Col span={24}>
          <Button disabled={
            (balanceOfTokenANotEnough || balanceOfTokenBNotEnough || !isValidPair)
          } onClick={() => setOpenAddConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
        </Col>
      </Row>
    </Spin>
    {
      tokenAAmount && tokenBAmount && isValidPair && openAddConfirmModal && <>
        <AddLiquidityConfirm openAddConfirmModal={openAddConfirmModal} setOpenAddConfirmModal={setOpenAddConfirmModal}
          tokenA={tokenA} tokenB={tokenB} tokenAAmount={tokenAAmount} tokenBAmount={tokenBAmount} />
      </>
    }
  </>
}
