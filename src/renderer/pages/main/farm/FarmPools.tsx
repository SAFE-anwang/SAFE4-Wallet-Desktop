import { Alert, Avatar, Button, Card, Col, Divider, List, Row, Table, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { MiniChefV2PoolInfo, MiniChefV2PoolInfoWithSafeswapPair, useMiniChefV2PoolInfos, useMiniChefV2PoolInfosFilterSafeswap } from "../../../hooks/useMiniChefV2";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { Pair, TokenAmount } from "@uniswap/sdk";
import TokenSymbol from "../../components/TokenSymbol";
import { useState } from "react";
import DepositLpToken from "./DepositLpToken";

const { Text, Title } = Typography;



export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const miniChefV2PoolMap = useMiniChefV2PoolInfosFilterSafeswap();
  const pools = miniChefV2PoolMap && Object.values(miniChefV2PoolMap);

  const [openDepositModal, setOpenDepositModal] = useState<boolean>(false);
  const [selectPool, setSelectPool] = useState<MiniChefV2PoolInfoWithSafeswapPair | undefined>(undefined);

  const doDepositLpToken = (pool: MiniChefV2PoolInfoWithSafeswapPair) => {
    setSelectPool(pool);
    setOpenDepositModal(true);
  }

  const columns = [
    {
      title: '流动性挖矿池',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        return <>
          {
            chainId && <>
              <ERC20TokenLogoComponent style={{ width: "32px", height: "32px", marginTop: "-14px" }} chainId={chainId} address={pair.token0.address} />
              <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", marginLeft: "-12px" }} chainId={chainId} address={pair.token1.address} />
            </>
          }
          <Text style={{ marginLeft: "10px" }} strong>{TokenSymbol(pair.token0)} / </Text>
          <Text strong>{TokenSymbol(pair.token1)}</Text>
        </>
      },
      width: 300
    },
    {
      title: 'LP 总质押',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        return <>
          {poolInfo.lpToken} / {pair.liquidityToken.address}
        </>
      },
      width: 300
    },
    {
      title: '权重',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        return <>

        </>
      },
      width: 300
    },
    {
      title: '已质押 LP',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        const { userInfo } = poolInfo;
        const stakeLpTokenAmount = new TokenAmount(pair.liquidityToken, userInfo.amount.toBigInt());
        return <>
          <Text>
            {stakeLpTokenAmount.toSignificant()}
          </Text>
        </>
      },
      width: 300
    },
    {
      title: '收益',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        const { pendingSushi } = poolInfo;
        const pendingSushiAmount = new TokenAmount(pair.liquidityToken, pendingSushi.toBigInt());
        return <>
          <Text>
            {pendingSushiAmount.toSignificant()}
          </Text>
        </>
      },
      width: 300
    },
    {
      title: '',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        const { pendingSushi } = poolInfo;
        const pendingSushiAmount = new TokenAmount(pair.liquidityToken, pendingSushi.toBigInt());
        return <>
          <Button onClick={() => {
            doDepositLpToken(pool);
          }}>参与挖矿</Button>
        </>
      },
      width: 300
    },
  ];

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          流动性挖矿
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "100%", float: "left" }}>
              <Alert type="info" message={<>
                通过质押流动性代币获取挖矿奖励
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          {
            JSON.stringify(pools)
          }
        </Card>
        <Table dataSource={pools} columns={columns} pagination={false} />
      </div>
    </div>

    {
      openDepositModal && selectPool && <DepositLpToken openDepositModal={openDepositModal} setOpenDepositModal={setOpenDepositModal}
        pool={selectPool} />
    }

  </>

}
