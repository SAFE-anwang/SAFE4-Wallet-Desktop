import { useEffect, useMemo, useState } from "react";
import { useTokens } from "../../../state/transactions/hooks";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { useMulticallContract, useSafeswapV2Factory } from "../../../hooks/useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { Contract } from "ethers";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Button, Col, Collapse, Divider, Row, Spin, Typography } from "antd";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { PriceType, SerializeToken } from "./Swap";
import { AssetPoolModule } from "./AssetPool";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import { useBlockNumber } from "../../../state/application/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";

const { Text } = Typography;

export interface PairPool {
  pairToken: Token,
  token0: Token,
  token1: Token,
  totalSupply: any,
  reservers: any,
  balanceOf: any
}

export default ({
  setAssetPoolModule
}: {
  setAssetPoolModule: (assetPoolModule: AssetPoolModule) => void
}) => {

  const tokens = useTokens();
  const dispatch = useDispatch();
  const blockNumber = useBlockNumber();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const safeswapV2Factory = useSafeswapV2Factory(false);
  const multicallContract = useMulticallContract();
  const [allPairs, setAllPairs] = useState<string[]>();
  const [pairPools, setPairPools] = useState<{ [address: string]: PairPool }>();
  const [loading, setLoading] = useState<boolean>(false);

  const nameEqSafeswapV2Tokens = useMemo(() => {
    if (tokens && chainId) {
      return Object.keys(tokens)
        .filter(address => {
          return tokens[address].chainId == chainId
            && tokens[address].name == "Safeswap V2"
        })
        .map(address => {
          const { name, symbol, decimals } = tokens[address];
          const token = new Token(
            ChainId.MAINNET,
            address, decimals,
            symbol, name
          );
          return token;
        });
    }
    return undefined
  }, [tokens, chainId]);

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

  useEffect(() => {
    if (safeswapV2Factory && multicallContract && blockNumber > 0) {
      safeswapV2Factory.allPairsLength()
        .then((data: any) => {
          const pairsLength = data.toNumber();
          const calls: CallMulticallAggregateContractCall[] = [];
          for (let i = 0; i < pairsLength; i++) {
            calls.push({
              contract: safeswapV2Factory,
              functionName: "allPairs",
              params: [i],
            })
          }
          CallMulticallAggregate(multicallContract, calls, () => {
            setAllPairs(calls.map(call => call.result));
          });
        });
    }
  }, [safeswapV2Factory, multicallContract, blockNumber]);

  const activeAccountPairs = useMemo(() => {
    if (nameEqSafeswapV2Tokens && allPairs) {
      return nameEqSafeswapV2Tokens.filter(token => {
        const address = token.address;
        return allPairs.includes(address);
      })
    }
  }, [nameEqSafeswapV2Tokens, allPairs]);

  useEffect(() => {
    if (activeAccountPairs && multicallContract && provider && activeAccount) {
      const pairResult: {
        [pairAddress: string]: {
          token0_call: CallMulticallAggregateContractCall,
          token1_call: CallMulticallAggregateContractCall,
          totalSupply_call: CallMulticallAggregateContractCall,
          balanceOf_call: CallMulticallAggregateContractCall,
          reservers_call: CallMulticallAggregateContractCall,
        }
      } = {};
      activeAccountPairs.forEach(pairToken => {
        const pairContract = new Contract(pairToken.address, PairABI, provider);
        const token0_call = {
          contract: pairContract,
          functionName: "token0",
          params: [],
        }
        const token1_call = {
          contract: pairContract,
          functionName: "token1",
          params: [],
        }
        const totalSupply_call = {
          contract: pairContract,
          functionName: "totalSupply",
          params: [],
        }
        const balanceOf_call = {
          contract: pairContract,
          functionName: "balanceOf",
          params: [activeAccount],
        }
        const reservers_call = {
          contract: pairContract,
          functionName: "getReserves",
          params: [],
        };
        pairResult[pairToken.address] = {
          token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call
        }
      });

      const calls: CallMulticallAggregateContractCall[] = [];
      Object.keys(pairResult).forEach(address => {
        const { token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call } = pairResult[address];
        calls.push(
          token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call
        )
      });

      setLoading(true);
      CallMulticallAggregate(multicallContract, calls, () => {
        setLoading(false);
        const pairPools: {
          [address: string]: PairPool
        } = {}
        Object.keys(pairResult).forEach(address => {
          const { token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call } = pairResult[address];
          const token0Address = token0_call.result;
          const token1Address = token1_call.result;
          const totalSupply = totalSupply_call.result;
          const balanceOf = balanceOf_call.result;
          const reservers = reservers_call.result;
          const token0 = allTokens && allTokens[token0Address];
          const token1 = allTokens && allTokens[token1Address];
          const pairToken = allTokens && allTokens[address];
          if (token0 && token1 && pairToken) {
            pairPools[address] = { token0, token1, totalSupply, balanceOf, reservers, pairToken };
          }
        });
        setPairPools(pairPools);
      });
    }
  }, [activeAccountPairs, multicallContract, provider, activeAccount, allTokens]);

  const addLiquidity = (token0: Token | undefined, token1: Token | undefined) => {
    if (token0 || token1) {
      dispatch(applicationUpdateSafeswapTokens({
        tokenA: token0 ? SerializeToken(token0) : undefined,
        tokenB: token1 ? SerializeToken(token1) : undefined
      }));
    }
    setAssetPoolModule(AssetPoolModule.Add);
  }

  const removeLiquidity = (token0: Token | undefined, token1: Token | undefined) => {
    if (token0 || token1) {
      dispatch(applicationUpdateSafeswapTokens({
        tokenA: token0 ? SerializeToken(token0) : undefined,
        tokenB: token1 ? SerializeToken(token1) : undefined
      }));
    }
    setAssetPoolModule(AssetPoolModule.Remove);
  }

  return <>

    <Button onClick={() => addLiquidity(undefined, undefined)} type="primary" style={{ width: "100%", height: "60px" }} size="large">
      添加流动性
    </Button>

    <Divider />
    <Text type="secondary">已添加仓位</Text>
    <Spin spinning={loading}>
      {
        !pairPools && <>
          <div style={{ height: "60px", background: "#efefef" }}></div>
        </>
      }
      {
        pairPools && <Collapse size="large"
          items={
            pairPools && Object.keys(pairPools).map(address => {
              const { token0, token1, reservers, balanceOf, totalSupply, pairToken } = pairPools[address];
              const token0Reserver = new TokenAmount(token0, reservers[0]);
              const token1Reserver = new TokenAmount(token1, reservers[1]);
              // 持有的 LP token 数量是 balanceOf
              const LPTokenAmount = new TokenAmount(pairToken, balanceOf);
              const TotalLPTokenAmount = new TokenAmount(pairToken, totalSupply);
              const lpTokenRatio = LPTokenAmount.divide(TotalLPTokenAmount);
              const token0Amount = token0Reserver.multiply(lpTokenRatio);
              const token1Amount = token1Reserver.multiply(lpTokenRatio);
              const price = {
                [PriceType.B2A]: token0Reserver.divide(token1Reserver).toFixed(4),
                [PriceType.A2B]: token1Reserver.divide(token0Reserver).toFixed(4),
              }
              const _token0 = token0.address == WSAFE[chainId as Safe4NetworkChainId].address ? undefined : token0;
              const _token1 = token1.address == WSAFE[chainId as Safe4NetworkChainId].address ? undefined : token1;
              return {
                key: address, label: <>
                  <Row>
                    <Col span={24} style={{ paddingTop: "-2px" }}>
                      <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token0.address} chainId={token0.chainId} />
                      <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token1.address} chainId={token1.chainId} />
                      <Text strong style={{ marginLeft: "20px" }}>{token0.symbol} / {token1.symbol}</Text>
                    </Col>
                  </Row>
                </>,
                children: <Row>
                  <Col span={24}>
                    <Text>库存 {token0.symbol}</Text>
                    <Text type="secondary" style={{ float: "right" }}>{ViewFiexdAmount(token0Reserver, token0)}</Text>
                  </Col>
                  <Col span={24}>
                    <Text>库存 {token1.symbol}</Text>
                    <Text type="secondary" style={{ float: "right" }}>{ViewFiexdAmount(token1Reserver, token1)}</Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>存入 {token0.symbol}</Text>
                    <Text strong style={{ float: "right" }}>{ViewFiexdAmount(token0Amount, token0)}</Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>存入 {token1.symbol}</Text>
                    <Text strong style={{ float: "right" }}>{ViewFiexdAmount(token1Amount, token1)}</Text>
                  </Col>
                  <Col span={24}>
                    <Text>价格</Text>
                  </Col>
                  <Col span={12}>
                    <Col span={24} style={{ textAlign: "center" }}>
                      <Text strong>{price[PriceType.A2B]}</Text> {token0 ? token0.symbol : "SAFE"}
                    </Col>
                    <Col span={24} style={{ textAlign: "center" }}>
                      <Text>1 {token1 ? token1.symbol : "SAFE"}</Text>
                    </Col>
                  </Col>
                  <Col span={12}>
                    <Col span={24} style={{ textAlign: "center" }}>
                      <Text strong>{price[PriceType.B2A]}</Text> {token1 ? token1.symbol : "SAFE"}
                    </Col>
                    <Col span={24} style={{ textAlign: "center" }}>
                      <Text>1 {token0 ? token0.symbol : "SAFE"}</Text>
                    </Col>
                  </Col>
                  <Divider />
                  <Col span={12} style={{ textAlign: "center" }}>
                    <Button onClick={() => addLiquidity(_token0, _token1)}>添加</Button>
                  </Col>
                  <Col span={12} style={{ textAlign: "center" }}>
                    <Button onClick={() => removeLiquidity(_token0, _token1)}>移除</Button>
                  </Col>
                </Row>
              }
            })
          }
        />
      }


    </Spin>


  </>

}
