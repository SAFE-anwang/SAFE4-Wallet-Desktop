import { useMemo } from "react";
import { Pair, Token, TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Button, Col, Collapse, Divider, Row, Spin, Typography } from "antd";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { PriceType, SerializeToken } from "./Swap";
import { AssetPoolModule } from "./AssetPool";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import { SafeswapV2Pairs, useSafeswapV2Pairs } from "./hooks";
import { calculatePairAddress } from "./Calculate";

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
  setAssetPoolModule , 
  safeswapV2Pairs
}: {
  setAssetPoolModule: (assetPoolModule: AssetPoolModule) => void,
  safeswapV2Pairs: SafeswapV2Pairs
}) => {
  const dispatch = useDispatch();
  const { chainId } = useWeb3React();
  const { loading , result } = safeswapV2Pairs;
  const pairsMap = result && result.pairsMap;
  const pairBalancesMap = result && result.pairBalancesMap;
  const pairTotalSuppliesMap = result && result.pairTotalSuppliesMap;
  const activePairs = useMemo<Pair[] | undefined>(() => {
    if (pairsMap && pairBalancesMap) {
      return Object.keys(pairBalancesMap).filter(pairAddress => {
        return pairBalancesMap[pairAddress].gt(0);
      }).map(pairAddress => pairsMap[pairAddress])
    }
    return undefined;
  }, [pairsMap, pairBalancesMap]);

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
        activePairs && activePairs.length == 0 &&
        <Row style={{ height: "60px", background: "#efefef", width: "100%" }}>
          <Text strong type="secondary" style={{ margin: "auto" }}>未加入流动性</Text>
        </Row>
      }
      {
        activePairs && activePairs.length > 0 && pairBalancesMap && pairTotalSuppliesMap && chainId && <Collapse size="large"
          items={
            activePairs.map(pair => {
              const { token0, token1, reserve0, reserve1, liquidityToken } = pair;
              const liquidityAddress = calculatePairAddress(token0, token1, chainId);
              if (liquidityAddress) {
                const balanceOf = pairBalancesMap[liquidityAddress];
                const totalSupply = pairTotalSuppliesMap[liquidityAddress];
                const LPTokenAmount = new TokenAmount(liquidityToken, balanceOf.toBigInt());
                const TotalLPTokenAmount = new TokenAmount(liquidityToken, totalSupply.toBigInt());
                const lpTokenRatio = LPTokenAmount.divide(TotalLPTokenAmount);
                const token0Amount = reserve0.multiply(lpTokenRatio);
                const token1Amount = reserve1.multiply(lpTokenRatio);
                const price = {
                  [PriceType.B2A]: reserve0.divide(reserve1).toFixed(4),
                  [PriceType.A2B]: reserve1.divide(reserve0).toFixed(4),
                }
                const _token0 = token0.address == WSAFE[chainId as Safe4NetworkChainId].address ? undefined : token0;
                const _token1 = token1.address == WSAFE[chainId as Safe4NetworkChainId].address ? undefined : token1;
                return {
                  key: liquidityToken.address,
                  label: <>
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
                      <Text type="secondary" style={{ float: "right" }}>{reserve0.toSignificant()}</Text>
                    </Col>
                    <Col span={24}>
                      <Text>库存 {token1.symbol}</Text>
                      <Text type="secondary" style={{ float: "right" }}>{reserve1.toSignificant()}</Text>
                    </Col>
                    <Col span={24}>
                      <Text strong>存入 {token0.symbol}</Text>
                      <Text strong style={{ float: "right" }}>{token0Amount.toSignificant(4)}</Text>
                    </Col>
                    <Col span={24}>
                      <Text strong>存入 {token1.symbol}</Text>
                      <Text strong style={{ float: "right" }}>{token1Amount.toSignificant(4)}</Text>
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
              }
              return {
                key: liquidityToken.address,
                label: <>
                  <Row>
                    <Col span={24} style={{ paddingTop: "-2px" }}>
                      <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token0.address} chainId={token0.chainId} />
                      <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token1.address} chainId={token1.chainId} />
                      <Text strong style={{ marginLeft: "20px" }}>{token0.symbol} / {token1.symbol}</Text>
                    </Col>
                  </Row>
                </>
              }
            })
          }
        />
      }
    </Spin>

  </>

}
