import { Alert, Avatar, Button, Card, Col, Divider, List, Row, Space, Table, Tag, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Farm, MiniChefV2PoolInfoWithSafeswapPair, useMiniChefV2PoolInfosFilterSafeswap } from "../../../hooks/useMiniChefV2";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { JSBI, Pair, Token, TokenAmount } from "@uniswap/sdk";
import TokenSymbol from "../../components/TokenSymbol";
import { useMemo, useState } from "react";
import DepositLpToken from "./DepositLpToken";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import { BigNumber } from "ethers";
import { MinusCircleOutlined, SyncOutlined } from "@ant-design/icons";
import Withdraws from "./Withdraws";
import { useWalletTokens } from "../../../state/transactions/hooks";
import EditFarm from "./EditFarm";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";

const { Text, Title } = Typography;

export enum RewardSpeedLevel {
  SECOND = "1",
  BLOCK = "30",
  Minute = "60",
  HOUR = "3600",
  DAY = "86400",
  MONTH = "2592000"
}
export const Default_Reward_Speed_Level = RewardSpeedLevel.HOUR;

export function calculateRewardSpeed(farm: Farm, pool: MiniChefV2PoolInfoWithSafeswapPair, level: RewardSpeedLevel,
  _userLpTokenStake?: BigNumber
) {
  const { pair, poolInfo } = pool;
  const allocPoint = poolInfo.allocPoint.toNumber();
  const { totalAllocPoint, sushiPerSecond } = farm;

  let update: {
    updateAmount: BigNumber,
    type: number
  } | undefined = undefined
  if (_userLpTokenStake) {
    let updateAmount = undefined;
    let type = undefined;
    if (_userLpTokenStake.gt(poolInfo.userInfo.amount)) {
      updateAmount = _userLpTokenStake.sub(poolInfo.userInfo.amount);
      type = 1;
    } else {
      updateAmount = poolInfo.userInfo.amount.sub(_userLpTokenStake);
      type = -1;
    }
    update = {
      updateAmount, type
    }
  }
  const userLpTokenStake = _userLpTokenStake ?? poolInfo.userInfo.amount;
  const poolLpTokenStake = update ? (
    update.type == 1 ? poolInfo.lpTokenBalance?.add(update.updateAmount)
      : poolInfo.lpTokenBalance?.sub(update.updateAmount)
  ) : poolInfo.lpTokenBalance;

  // pool reward per second;
  const poolRewardPerSecond: BigNumber = totalAllocPoint.gt(BigNumber.from("0")) ? sushiPerSecond
    .mul(allocPoint)
    .div(totalAllocPoint) : BigNumber.from("0");
  let userRewardPerSecond: BigNumber | undefined = undefined;
  if (poolLpTokenStake && poolLpTokenStake.gt(BigNumber.from("0"))
    && userLpTokenStake && userLpTokenStake.gt(BigNumber.from("0"))) {
    userRewardPerSecond = userLpTokenStake.mul(poolRewardPerSecond)
      .div(poolLpTokenStake);
  }
  // [60:min , 3600:hour ];
  const poolRewardPerLevelAmount = new TokenAmount(pair.liquidityToken, poolRewardPerSecond.toBigInt())
    .multiply(JSBI.BigInt(level));
  const userRewardPerLevelAmount = userRewardPerSecond && new TokenAmount(pair.liquidityToken, userRewardPerSecond.toBigInt())
    .multiply(JSBI.BigInt(level));
  return [poolRewardPerLevelAmount, userRewardPerLevelAmount];
}

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const { miniChefV2PoolMap, farm, loading } = useMiniChefV2PoolInfosFilterSafeswap();
  const pools = miniChefV2PoolMap && Object.values(miniChefV2PoolMap);
  const [openDepositModal, setOpenDepositModal] = useState<boolean>(false);
  const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
  const [openEditFarmModal, setOpenEditFarmModal] = useState<boolean>(false);
  const [selectPool, setSelectPool] = useState<MiniChefV2PoolInfoWithSafeswapPair | undefined>(undefined);
  const isOwner = activeAccount == farm?.owner;

  const doDepositLpToken = (pool: MiniChefV2PoolInfoWithSafeswapPair) => {
    setSelectPool(pool);
    setOpenDepositModal(true);
  }

  const doWithdraw = (pool: MiniChefV2PoolInfoWithSafeswapPair) => {
    setSelectPool(pool);
    setOpenWithdrawModal(true);
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
        const {
          token0, token1,
        } = pair;
        const {
          reservers, totalSupply
        } = pairResult;
        const liquidityToken = new Token(pair.liquidityToken.chainId, poolInfo.lpToken, pair.liquidityToken.decimals, pair.liquidityToken.name);
        const token0Reserver = new TokenAmount(token0, reservers[0].toBigInt());
        const token1Reserver = new TokenAmount(token1, reservers[1].toBigInt());
        // MiniChefV2 已质押到该池子的流动性代币数量
        const lpTokenStakeAmount = poolInfo.lpTokenBalance && new TokenAmount(liquidityToken, poolInfo.lpTokenBalance.toBigInt());
        // 流动性代币总供应
        const TotalLPTokenAmount = new TokenAmount(liquidityToken, totalSupply.toBigInt());
        // MiniChefV2 持有占比
        const lpTokenRatio = lpTokenStakeAmount && lpTokenStakeAmount.divide(TotalLPTokenAmount);
        // 基于占比，计算用户所拥有的存入代币数量
        const token0Amount = lpTokenRatio && token0Reserver.multiply(lpTokenRatio);
        const token1Amount = lpTokenRatio && token1Reserver.multiply(lpTokenRatio);
        const token0Stake = token0Amount && ViewFiexdAmount(token0Amount, token0, 2);
        const token1Stake = token1Amount && ViewFiexdAmount(token1Amount, token1, 2);
        return <>
          <Row>
            <Col span={24}>
              <Text type="secondary" strong>{token0Stake}</Text>
              <Text style={{ float: "right" }}>
                {TokenSymbol(token0)}
              </Text>
            </Col>
            <Col span={24}>
              <Text type="secondary" strong>{token1Stake}</Text>
              <Text style={{ float: "right" }}>
                {TokenSymbol(token1)}
              </Text>
            </Col>
          </Row>
        </>
      },
      width: 300
    },
    {
      title: '奖励速率/小时',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        if (!farm) {
          return;
        }
        const [poolRewardPerSecondAmount, userRewardPerSecondAmount] = calculateRewardSpeed(farm, pool, Default_Reward_Speed_Level);
        return <>
          <Row>
            <Col span={24}>
              <Text strong type="secondary">
                {poolRewardPerSecondAmount?.toSignificant(4)}
              </Text>
            </Col>
            <Col span={24}>
              {userRewardPerSecondAmount ? <>
                <Tooltip title={<>
                  <Text style={{ color: "white" }}>基于您质押的LP在该挖矿池中总质押LP的占比,计算您当前的奖励速率</Text>
                </>}>
                  <Tag icon={<SyncOutlined spin style={{ color: "#091e9ae0" }} />}>
                    <Text strong style={{ color: "#091e9ae0" }} italic>{userRewardPerSecondAmount.toSignificant(4)}</Text>
                  </Tag>
                </Tooltip>
              </> : <>
                <Tag icon={<MinusCircleOutlined style={{ color: "#ad8787" }} />}>
                  <Text type="secondary">未质押</Text>
                </Tag>
              </>}
            </Col>
          </Row>
        </>
      },
      width: 300
    },
    {
      title: '已质押 LP',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { pair, pairResult, poolInfo } = pool;
        const { userInfo } = poolInfo;
        const {
          token0, token1,
        } = pair;
        const {
          reservers, totalSupply
        } = pairResult;
        const liquidityToken = new Token(pair.liquidityToken.chainId, poolInfo.lpToken, pair.liquidityToken.decimals, pair.liquidityToken.name);
        const token0Reserver = new TokenAmount(token0, reservers[0].toBigInt());
        const token1Reserver = new TokenAmount(token1, reservers[1].toBigInt());
        // 用户已质押到该池子的流动性代币数量
        const lpTokenStakeAmount = new TokenAmount(liquidityToken, userInfo.amount.toBigInt());
        // 流动性代币总供应
        const TotalLPTokenAmount = new TokenAmount(liquidityToken, totalSupply.toBigInt());
        // 用户持有占比
        const lpTokenRatio = lpTokenStakeAmount.divide(TotalLPTokenAmount);
        // 基于占比，计算用户所拥有的存入代币数量
        const token0Amount = token0Reserver.multiply(lpTokenRatio);
        const token1Amount = token1Reserver.multiply(lpTokenRatio);
        const token0Stake = ViewFiexdAmount(token0Amount, token0, 2);
        const token1Stake = ViewFiexdAmount(token1Amount, token1, 2);
        return <>
          <Row>
            <Col span={24}>
              <Text strong>{token0Stake}</Text>
              <Text style={{ float: "right" }}>
                {TokenSymbol(token0)}
              </Text>
            </Col>
            <Col span={24}>
              <Text strong>{token1Stake}</Text>
              <Text style={{ float: "right" }}>
                {TokenSymbol(token1)}
              </Text>
            </Col>
          </Row>
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
          <Text type="success" strong>
            {
              pendingSushi.gt(BigNumber.from("0")) ? pendingSushiAmount.toFixed(4) : "-"
            }
          </Text>
        </>
      },
      width: 300
    },
    {
      title: '操作',
      render: (_: any, pool: MiniChefV2PoolInfoWithSafeswapPair) => {
        const { poolInfo } = pool;
        const couldWithdraw = poolInfo.pendingSushi.gt(BigNumber.from("0"))
          || poolInfo.userInfo.amount.gt(BigNumber.from("0"));
        return <>
          <Space>
            <Button onClick={() => {
              doDepositLpToken(pool);
            }}>参与挖矿</Button>
            <Button disabled={!couldWithdraw} onClick={() => {
              doWithdraw(pool);
            }}>提现</Button>
          </Space>

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
            isOwner && <>
              <Space>
                <Button onClick={() => setOpenEditFarmModal(true)}>编辑农场</Button>
              </Space>
            </>
          }
        </Card>
        <Table loading={loading} dataSource={pools} columns={columns} pagination={false} />
      </div>
    </div>
    {
      openDepositModal && selectPool && farm && <DepositLpToken openDepositModal={openDepositModal} setOpenDepositModal={setOpenDepositModal}
        pool={selectPool} farm={farm} />
    }
    {
      openWithdrawModal && selectPool && farm && <Withdraws openWithdrawModal={openWithdrawModal} setOpenWithdrawModal={setOpenWithdrawModal}
        pool={selectPool} farm={farm} />
    }
    {
      openEditFarmModal && farm && pools && <EditFarm openEditFarmModal={openEditFarmModal} setOpenEditFarmModal={setOpenEditFarmModal}
        farm={farm} pools={pools} />
    }
  </>

}
