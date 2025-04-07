import { ArrowDownOutlined, DownOutlined, LeftOutlined, PlusOutlined, SwapOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, InputNumberProps, MenuProps, message, Row, Select, Slider, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChainId, CurrencyAmount, Fraction, Token, TokenAmount } from "@uniswap/sdk";
import { Contract, ethers } from "ethers";
import { useETHBalances, useTokenAllowanceAmounts, useTokenBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import { calculateAmountAdd, calculateAmountIn, calculateAmountOut, calculatePaireAddress, getReserve, sort } from "./Calculate";
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

export default ({
  setAssetPoolModule
}: {
  setAssetPoolModule: (assetPoolModule: AssetPoolModule) => void
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const signer = useWalletsActiveSigner()
  const activeAccount = useWalletsActiveAccount();
  const dispatch = useDispatch();
  const blockNumber = useBlockNumber();
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

  const [token0, setToken0] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenA) : Default_Swap_Token ? Default_Swap_Token[0] : undefined
  );
  const [token1, setToken1] = useState<Token | undefined>(
    safeswapTokens ? parseTokenData(safeswapTokens.tokenB) : Default_Swap_Token ? Default_Swap_Token[1] : undefined
  );
  const [priceType, setPriceType] = useState<PriceType | undefined>(PriceType.B2A);
  const [reservers, setReservers] = useState<{ [address: string]: any }>();
  const [token0Amount, setToken0Amount] = useState<string>();
  const [token1Amount, setToken1Amount] = useState<string>();
  const [pairNonce , setPairNonce] = useState<any>(undefined);

  const [openRemoveConfirmModal, setOpenRemoveConfirmModal] = useState<boolean>(false);

  const pairAddress = chainId && calculatePaireAddress(token0, token1, chainId);
  const pairContract = pairAddress && useContract(pairAddress, PairABI, false);
  const multicallContract = useMulticallContract();

  const [activeAccountReservers, setActiveAccountReservers] = useState<{
    [address: string]: Fraction
  }>();

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
      CallMulticallAggregate(multicallContract, calls, () => {
        const sortTokens = sort(token0, token1, chainId);
        const totalSupply = totalSupply_call.result;
        const balanceOf = balanceOf_call.result;
        const reservers = reservers_call.result;
        const pairToken = allTokens[pairAddress];
        if (sortTokens) {
          const [token0, token1] = sortTokens;
          const token0Reserver = new TokenAmount(token0, reservers[0]);
          const token1Reserver = new TokenAmount(token1, reservers[1]);
          // 持有的 LP token 数量是 balanceOf
          const LPTokenAmount = new TokenAmount(pairToken, balanceOf);
          const TotalLPTokenAmount = new TokenAmount(pairToken, totalSupply);
          const lpTokenRatio = LPTokenAmount.divide(TotalLPTokenAmount);
          const token0Amount = token0Reserver.multiply(lpTokenRatio);
          const token1Amount = token1Reserver.multiply(lpTokenRatio);
          setActiveAccountReservers({
            [token0.address]: token0Amount,
            [token1.address]: token1Amount
          });
          setToken0Amount(token0Amount.toFixed(token0.decimals));
          setToken1Amount(token1Amount.toFixed(token1.decimals));
          setPairNonce( nonce_call.result.toNumber() )
        }
      });

      // setReservers(undefined);
      // pairContract.getReserves().then((data: any) => {
      //   const [r0, r1] = data;
      //   const sortTokens = sort(tokenA, tokenB, chainId);
      //   if (sortTokens) {
      //     const reservers: { [address: string]: any } = {};
      //     reservers[sortTokens[0].address] = r0;
      //     reservers[sortTokens[1].address] = r1;
      //     setReservers(reservers);
      //     console.log("Reservers :" , reservers)
      //   }
      // }).catch((err: any) => {
      //   // 未创建流动性
      // })
    }
  }, [pairContract, multicallContract, activeAccount, allTokens]);

  const [inputValue, setInputValue] = useState(0);

  const onChange: InputNumberProps['onChange'] = (newValue) => {
    setInputValue(newValue as number);
  };

  return <>
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
          min={0}
          max={100}
          onChange={onChange}
          value={typeof inputValue === 'number' ? inputValue : 0}
        />
      </Col>
      <Col span={24}>
        <Row>
          <Col span={6}>
            <Button size="large" type="dashed">25%</Button>
          </Col>
          <Col span={6}>
            <Button size="large" type="dashed">50%</Button>
          </Col>
          <Col span={6}>
            <Button size="large" type="dashed">75%</Button>
          </Col>
          <Col span={6}>
            <Button size="large" type="dashed">100%</Button>
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
          <Col span={18}>
            <Text style={{ fontSize: "24px" }}>- {activeAccountReservers && token0 && activeAccountReservers[token0.address].toFixed(6)}</Text>
          </Col>
          <Col span={6} style={{ textAlign: "right" }}>
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
          <Col span={18}>
            <Text style={{ fontSize: "24px" }}>- {activeAccountReservers && token1 && activeAccountReservers[token1.address].toFixed(6)}</Text>
          </Col>
          <Col span={6} style={{ textAlign: "right" }}>
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
        <Button onClick={() => setOpenRemoveConfirmModal(true)} type="primary" style={{ float: "right" }}>{t("next")}</Button>
      </Col>
    </Row>
    {
      openRemoveConfirmModal && token0Amount && token1Amount && pairNonce != undefined && <>
        <RemoveLiquidityConfirm openRemoveConfirmModal={openRemoveConfirmModal} setOpenRemoveConfirmModal={setOpenRemoveConfirmModal}
          token0={token0} token1={token1} token0Amount={token0Amount} token1Amount={token1Amount} nonce={pairNonce} />
      </>
    }
  </>
}
