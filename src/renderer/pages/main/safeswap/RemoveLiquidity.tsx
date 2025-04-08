import { ArrowDownOutlined, DownOutlined, LeftOutlined, PlusOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, InputNumberProps, MenuProps, message, Row, Select, Slider, Space, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Fraction, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import { calculateAmountAdd, calculateAmountIn, calculateAmountOut, calculatePairAddress, getReserve, sort } from "./Calculate";
import { useContract, useIERC20Contract, useMulticallContract } from "../../../hooks/useContracts";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useBlockNumber, useSafeswapTokens } from "../../../state/application/hooks";
import { useTokens } from "../../../state/transactions/hooks";
import TokenButtonSelect from "./TokenButtonSelect";
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import { IERC20_Interface } from "../../../abis";
import AddLiquidityConfirm from "./AddLiquidityConfirm";
import { Default_Safeswap_Tokens, isDecimalPrecisionExceeded, parseTokenData, SerializeToken } from "./Swap";
import { useDispatch } from "react-redux";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import { AssetPoolModule } from "./AssetPool";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../components/TokenLogo";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import RemoveLiquidityConfirm from "./RemoveLiquidityConfirm";
import { ZERO } from "../../../utils/CurrentAmountUtils";
const { Title, Text, Link } = Typography;

const enum SwapFocus {
  BuyIn = "BuyIn",
  SellOut = "SellOut",
}

const enum PriceType {
  A2B = "A2B",
  B2A = "B2A"
}

export default ({
  setAssetPoolModule
}: {
  setAssetPoolModule: (assetPoolModule: AssetPoolModule) => void
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const multicallContract = useMulticallContract();
  const safeswapTokens = useSafeswapTokens();
  const Default_Swap_Token = chainId && Default_Safeswap_Tokens(chainId);
  const tokens = useTokens();
  const allTokens = useMemo(() => {
    if (tokens && chainId) {
      const _all: { [address: string]: Token } = {};
      Object.keys(tokens)
        .forEach(address => {
          const { name, symbol, decimals } = tokens[address];
          const token = new Token(
            ChainId.MAINNET,
            address, decimals,
            symbol, name
          );
          _all[address] = token;
        });
      _all[USDT[chainId as Safe4NetworkChainId].address] = USDT[chainId as Safe4NetworkChainId];
      _all[WSAFE[chainId as Safe4NetworkChainId].address] = WSAFE[chainId as Safe4NetworkChainId];
      return _all;
    }
  }, [tokens, chainId]);
  const token0 = safeswapTokens ? parseTokenData(safeswapTokens.tokenA) : Default_Swap_Token ? Default_Swap_Token[0] : undefined;
  const token1 = safeswapTokens ? parseTokenData(safeswapTokens.tokenB) : Default_Swap_Token ? Default_Swap_Token[1] : undefined;
  const pairAddress = chainId && calculatePairAddress(token0, token1, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const [token0Amount, setToken0Amount] = useState<string>();
  const [token1Amount, setToken1Amount] = useState<string>();
  const [lpTokenAmount, setLpTokenAmount] = useState<CurrencyAmount>();
  const [removeLpTokenAmount, setRemoveLpTokenAmount] = useState<Fraction>();
  const [lpToken, setLpToken] = useState<Token>();
  const [openRemoveConfirmModal, setOpenRemoveConfirmModal] = useState<boolean>(false);
  const [pairNonce, setPairNonce] = useState<any>(undefined);
  const [activeAccountReservers, setActiveAccountReservers] = useState<{
    [address: string]: Fraction
  }>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (pairContract && multicallContract && activeAccount && allTokens) {
      const calls: CallMulticallAggregateContractCall[] = [];
      const totalSupply_call: CallMulticallAggregateContractCall = {
        contract: pairContract,
        functionName: "totalSupply",
        params: [],
      }
      const balanceOf_call: CallMulticallAggregateContractCall = {
        contract: pairContract,
        functionName: "balanceOf",
        params: [activeAccount],
      }
      const reservers_call: CallMulticallAggregateContractCall = {
        contract: pairContract,
        functionName: "getReserves",
        params: [],
      };
      const nonce_call: CallMulticallAggregateContractCall = {
        contract: pairContract,
        functionName: "nonces",
        params: [activeAccount],
      };
      calls.push(totalSupply_call, balanceOf_call, reservers_call, nonce_call);
      setLoading(true);
      setActiveAccountReservers(undefined);
      setLpTokenAmount(undefined);
      setToken0Amount(undefined);
      setToken1Amount(undefined);
      setInputValue(0);
      CallMulticallAggregate(multicallContract, calls, () => {
        setLoading(false);
        const sortTokens = sort(token0, token1, chainId);
        const totalSupply = totalSupply_call.result;
        const balanceOf = balanceOf_call.result;
        const reservers = reservers_call.result;
        const lpToken = allTokens[pairAddress];
        if (sortTokens) {
          const [token0, token1] = sortTokens;
          const token0Reserver = new TokenAmount(token0, reservers[0]);
          const token1Reserver = new TokenAmount(token1, reservers[1]);
          // 用户持有流动性代币数量
          const LPTokenAmount = new TokenAmount(lpToken, balanceOf);
          // 流动性代币总供应
          const TotalLPTokenAmount = new TokenAmount(lpToken, totalSupply);
          // 用户持有占比
          const lpTokenRatio = LPTokenAmount.divide(TotalLPTokenAmount);
          // 基于占比，计算用户所拥有的存入代币数量
          const token0Amount = token0Reserver.multiply(lpTokenRatio);
          const token1Amount = token1Reserver.multiply(lpTokenRatio);
          setActiveAccountReservers({
            [token0.address]: token0Amount,
            [token1.address]: token1Amount
          });
          // Pair.Nonce 用于 Permit() 签名
          setPairNonce(nonce_call.result.toNumber());
          setLpTokenAmount(LPTokenAmount);
          setLpToken(lpToken);
        }
      });
    }
  }, [pairContract, multicallContract, activeAccount, allTokens]);

  const [inputValue, setInputValue] = useState(0);
  const onChange: InputNumberProps['onChange'] = (newValue) => {
    setInputValue(newValue as number);
  };
  useEffect(() => { calculateRemove() }, [inputValue]);

  const hasLPToken = useMemo(() => {
    return lpTokenAmount && lpTokenAmount.greaterThan(ZERO);
  }, [lpTokenAmount]);

  const { activeAccountToken0Reserve, activeAccountToken1Reserve } = useMemo(() => {
    let activeAccountToken0Reserve = undefined;
    let activeAccountToken1Reserve = undefined;
    if (chainId && activeAccountReservers) {
      activeAccountToken0Reserve = getReserve(token0, activeAccountReservers, chainId);
      activeAccountToken1Reserve = getReserve(token1, activeAccountReservers, chainId);
    }
    return {
      activeAccountToken0Reserve, activeAccountToken1Reserve
    };

  }, [activeAccountReservers, token0, token1, chainId])

  const calculateRemove = () => {
    if (activeAccount && activeAccountReservers && lpTokenAmount && chainId) {
      const removePercent = new Fraction(JSBI.BigInt(inputValue as number), JSBI.BigInt(100));
      if (activeAccountReservers) {
        let _token0Remove, _token1Remove;
        if (!removePercent.equalTo(JSBI.BigInt(0))) {
          _token0Remove = getReserve(token0, activeAccountReservers, chainId).multiply(removePercent);
          _token1Remove = getReserve(token1, activeAccountReservers, chainId).multiply(removePercent);
          setToken0Amount(ViewFiexdAmount(_token0Remove, token0, 6));
          setToken1Amount(ViewFiexdAmount(_token1Remove, token1, 6));
          setRemoveLpTokenAmount(lpTokenAmount.multiply(removePercent));
        } else {
          setToken0Amount(undefined);
          setToken1Amount(undefined);
          setRemoveLpTokenAmount(undefined);
        }
      }
    }
  }

  return <>
    <Spin spinning={loading}>
      <Row>
        <Divider style={{ marginTop: "0px", marginBottom: "20px" }} />
        <Col span={24} style={{ textAlign: "center" }}>
          <LeftOutlined onClick={() => {
            setAssetPoolModule(AssetPoolModule.List);
          }} style={{ float: "left", fontSize: "20px" }} />
          <Text style={{ width: "100%", fontSize: "20px", lineHeight: "20px" }}>
            移除流动性
          </Text>
        </Col>
        <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      </Row>

      <Row>
        <Col span={24}>
          <Text type="secondary" strong>数量</Text>
        </Col>
        <Col span={24}>
          <Text strong style={{ fontSize: "60px" }}>{inputValue}%</Text>
        </Col>
        <Col span={24}>
          <Slider
            disabled={!hasLPToken}
            min={0}
            max={100}
            onChange={onChange}
            value={typeof inputValue === 'number' ? inputValue : 0}
          />
        </Col>
        <Col span={24}>
          <Row>
            <Col span={6}>
              <Button disabled={!hasLPToken} onClick={() => setInputValue(25)} size="large" type="dashed">25%</Button>
            </Col>
            <Col span={6}>
              <Button disabled={!hasLPToken} onClick={() => setInputValue(50)} size="large" type="dashed">50%</Button>
            </Col>
            <Col span={6}>
              <Button disabled={!hasLPToken} onClick={() => setInputValue(75)} size="large" type="dashed">75%</Button>
            </Col>
            <Col span={6}>
              <Button disabled={!hasLPToken} onClick={() => setInputValue(100)} size="large" type="dashed">100%</Button>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: "center" }}>
          <ArrowDownOutlined style={{ fontSize: "24px", color: "green", marginTop: "15px", marginBottom: "10px" }} />
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={12}>
              <Text style={{ fontSize: "24px" }}>- {token0Amount}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text style={{ fontSize: "24px" }}>{token0 ? token0.symbol : "SAFE"}</Text>
              <div style={{ float: "right", marginTop: "2px", marginLeft: "5px", textAlign: "center" }}>
                {
                  !token0 && <TokenLogo />
                }
                {
                  chainId && token0 &&
                  <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "2px" }} chainId={chainId} address={token0.address} />
                }
              </div>
            </Col>
          </Row>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={12}>
              <Text style={{ fontSize: "24px" }}>- {token1Amount}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text style={{ fontSize: "24px" }}>{token1 ? token1.symbol : "SAFE"}</Text>
              <div style={{ float: "right", marginTop: "2px", marginLeft: "5px", textAlign: "center" }}>
                {
                  !token1 && <TokenLogo />
                }
                {
                  chainId && token1 &&
                  <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "2px" }} chainId={chainId} address={token1.address} />
                }
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      <Divider />

      <Row>
        <Col span={24}>
          <Text strong type="secondary">当前仓位</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={12}>
              {
                token0 ? <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token0.address} chainId={token0.chainId} />
                  : <TokenLogo />
              }
              {
                token1 ? <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token1.address} chainId={token1.chainId} />
                  : <TokenLogo />
              }
              <Text strong style={{ marginLeft: "5px" }}>{token0 ? token0.symbol : "SAFE"} / {token1 ? token1.symbol : "SAFE"}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text strong style={{ fontSize: "18px", lineHeight: "36px" }}>
                {lpTokenAmount && ViewFiexdAmount(lpTokenAmount, undefined)}
              </Text>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Row>
            <Col span={12}>
              <Text type="secondary">{token0 ? token0.symbol : "SAFE"}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type="secondary">
                {activeAccountToken0Reserve && ViewFiexdAmount(activeAccountToken0Reserve, token0)}
              </Text>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Row>
            <Col span={12}>
              <Text type="secondary">{token1 ? token1.symbol : "SAFE"}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type="secondary">
                {activeAccountToken1Reserve && ViewFiexdAmount(activeAccountToken1Reserve, token1)}
              </Text>
            </Col>
          </Row>
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Button disabled={!(inputValue ? inputValue > 0 : false)}
            onClick={() => setOpenRemoveConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
        </Col>
      </Row>
    </Spin>
    {
      openRemoveConfirmModal && token0Amount && token1Amount && pairNonce != undefined && removeLpTokenAmount && lpToken && <>
        <RemoveLiquidityConfirm openRemoveConfirmModal={openRemoveConfirmModal} setOpenRemoveConfirmModal={setOpenRemoveConfirmModal}
          token0={token0} token1={token1} token0Amount={token0Amount} token1Amount={token1Amount} nonce={pairNonce}
          removeLpTokenAmount={removeLpTokenAmount} lpToken={lpToken} />
      </>
    }
  </>
}
