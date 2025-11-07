import { Button, Col, Divider, Input, Modal, Row, Slider, Typography } from "antd"
import { Farm, MiniChefV2PoolInfoWithSafeswapPair } from "../../../hooks/useMiniChefV2"
import { useMemo, useState } from "react";
import { TokenAmount } from "@uniswap/sdk";
import { BigNumber, ethers } from "ethers";
import { RewardSpeedLevel } from "./FarmPools";
import { useWeb3React } from "@web3-react/core";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenSymbol from "../../components/TokenSymbol";
import { useMiniChefV2 } from "../../../hooks/useContracts";
import { EmptyContract } from "../../../constants/SystemContracts";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import EstimateTx from "../../../utils/EstimateTx";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { SendOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";


const { Text } = Typography;

export default ({
  farm, pools, openEditFarmModal, setOpenEditFarmModal
}: {
  farm: Farm,
  pools: MiniChefV2PoolInfoWithSafeswapPair[],
  openEditFarmModal: boolean,
  setOpenEditFarmModal: (openEditFarmModal: boolean) => void
}) => {
  const { chainId, provider } = useWeb3React();
  const miniChefV2Contract = useMiniChefV2();

  const Farm_SUSHI_BalanceAmount = new TokenAmount(
    farm.SUSHI_Token, farm.SUSHI_Balance.toBigInt()
  );

  const perSecondTokenAmount = new TokenAmount(
    farm.SUSHI_Token, farm.sushiPerSecond.toBigInt()
  )
  const [perSecond, setPerSecond] = useState(perSecondTokenAmount.toExact());
  const _poolAllocPointMap = pools.reduce((map, pool) => {
    map[
      pool.poolInfo.pid
    ] = pool.poolInfo.allocPoint;
    return map;
  }, {} as {
    [pid: number]: BigNumber
  });
  const [poolAllocPointMap, setPoolAllocPointMap] = useState(_poolAllocPointMap);
  const totalAllocPoint = useMemo(() => {
    return Object.values(poolAllocPointMap).reduce((total, allocPoint) => {
      total = total.add(allocPoint)
      return total;
    })
  }, [poolAllocPointMap]);

  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const activeAccount = useWalletsActiveAccount();
  const { t } = useTranslation();

  const cancel = () => {
    setOpenEditFarmModal(false);
  }

  const editable = useMemo(() => {
    let perSecondChanged = false;
    try {
      const perSecondSUSHI = ethers.utils.parseUnits(
        perSecond, farm.SUSHI_Token.decimals
      );
      perSecondChanged = !perSecondSUSHI.eq(farm.sushiPerSecond);
    } catch (err) {

    }
    const allocPointChanged = Object.keys(poolAllocPointMap).filter(pid => {
      return !poolAllocPointMap[Number(pid)].eq(_poolAllocPointMap[Number(pid)]);
    });
    const totalAllocPoint = Object.values(poolAllocPointMap).reduce((total, allocPoint) => {
      total = total.add(allocPoint);
      return total;
    }, BigNumber.from("0"))
    return (perSecondChanged || allocPointChanged.length > 0) && totalAllocPoint.gt(BigNumber.from("0"));
  }, [perSecond, poolAllocPointMap])

  const doEditFarm = async () => {

    if (miniChefV2Contract && provider && chainId) {
      const perSecondSUSHI = ethers.utils.parseUnits(
        perSecond, farm.SUSHI_Token.decimals
      );
      let calls: string[] = [];
      if (!perSecondSUSHI.eq(farm.sushiPerSecond)) {
        const setSushiPerSecondCall = miniChefV2Contract.interface.encodeFunctionData("setSushiPerSecond", [perSecondSUSHI]);
        calls.push(setSushiPerSecondCall);
      }
      Object.keys(poolAllocPointMap).forEach(pid => {
        if (!poolAllocPointMap[Number(pid)].eq(_poolAllocPointMap[Number(pid)])) {
          const updateAllocPointCall = miniChefV2Contract.interface.encodeFunctionData("set", [
            pid,
            poolAllocPointMap[Number(pid)],
            EmptyContract.EMPTY,
            false
          ]);
          calls.push(updateAllocPointCall);
        }
      });
      if (calls.length > 0) {
        // 对所有池子进行 deposit(0)
        const poolsDepositZEROCalls = Object.keys(_poolAllocPointMap).map(pid => {
          const depositZEROCall = miniChefV2Contract.interface.encodeFunctionData("deposit", [
            BigNumber.from(pid),
            BigNumber.from("0"),
            activeAccount
          ]);
          return depositZEROCall;
        });
        const allCalls: string[] = [];
        allCalls.push(...poolsDepositZEROCalls);
        allCalls.push(...calls);
        const data = miniChefV2Contract.interface.encodeFunctionData("batch", [allCalls, true]);
        setSending(true);
        let tx: ethers.providers.TransactionRequest = {
          to: miniChefV2Contract.address,
          data,
          chainId,
        };
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: miniChefV2Contract.address }, response, {
              call: {
                from: activeAccount,
                to: miniChefV2Contract.address,
                input: data,
                value: "0"
              }
            });
            setTxHash(hash);
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      }
    }
  }

  const RenderSpeedIntervals = (perSecondBN: BigNumber) => {
    const speed_block = perSecondBN.mul(BigNumber.from(RewardSpeedLevel.BLOCK));
    const speed_hour = perSecondBN.mul(BigNumber.from(RewardSpeedLevel.HOUR));
    const speed_day = perSecondBN.mul(BigNumber.from(RewardSpeedLevel.DAY));
    const speed_month = perSecondBN.mul(BigNumber.from(RewardSpeedLevel.MONTH));
    const BLOCK = new TokenAmount(farm.SUSHI_Token, speed_block.toBigInt());
    const HOUR = new TokenAmount(farm.SUSHI_Token, speed_hour.toBigInt());
    const DAY = new TokenAmount(farm.SUSHI_Token, speed_day.toBigInt());
    const MONTH = new TokenAmount(farm.SUSHI_Token, speed_month.toBigInt());
    return <>
      <Row>
        <Col span={6}>
          <Text type="secondary">每30秒</Text>
          <br />
          <Text strong>{BLOCK.toSignificant(4)}</Text>
        </Col>
        <Col span={6}>
          <Text type="secondary">每小时</Text>
          <br />
          <Text strong>{HOUR.toSignificant(4)}</Text>
        </Col>
        <Col span={6}>
          <Text type="secondary">每天</Text>
          <br />
          <Text strong>{DAY.toSignificant(4)}</Text>
        </Col>
        <Col span={6}>
          <Text type="secondary">每月</Text>
          <br />
          <Text strong>{MONTH.toSignificant(4)}</Text>
        </Col>
      </Row>
    </>
  }

  return <>
    <Modal title="编辑 Farm" open={openEditFarmModal} footer={null} onCancel={cancel}>
      <Divider />
      {
        render
      }
      <Row>
        <Col span={12}>
          <Col span={24}>
            <Text type="secondary" strong>奖励速率/每秒</Text>
          </Col>
          <Col span={24}>
            <Input value={perSecond} onChange={(event) => {
              const value = event.target.value;
              if (value) {
                try {
                  ethers.utils.parseUnits(value, farm.SUSHI_Token.decimals);
                  setPerSecond(value);
                } catch (err) {

                }
              } else {
                setPerSecond(value);
              }
            }} />
          </Col>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Col span={24}>
            <Text strong type="secondary">农场余额</Text>
          </Col>
          <Col span={24}>
            <Text strong>{Farm_SUSHI_BalanceAmount.toFixed(4)}</Text>
          </Col>
        </Col>

        <Col span={24} style={{ marginTop: "5px" }}>
          {
            RenderSpeedIntervals(
              perSecond ? ethers.utils.parseUnits(perSecond, farm.SUSHI_Token.decimals) : BigNumber.from("0")
            )
          }
        </Col>
      </Row>

      <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text strong type="secondary">池权重
            <Divider type="vertical" />
            {totalAllocPoint.toNumber()}
          </Text>
        </Col>
        <Col span={24}>
          {
            pools.map((pool) => {
              const { poolInfo, pair } = pool;
              const poolAllocPoint = poolAllocPointMap[poolInfo.pid];
              const totalAllocPoint = Object.values(poolAllocPointMap).reduce((total, allocPoint) => {
                total = total.add(allocPoint)
                return total;
              }, BigNumber.from("0"));
              const farmPerSecondBN = perSecond ? ethers.utils.parseUnits(perSecond, farm.SUSHI_Token.decimals) : BigNumber.from("0");
              const poolPerSecondBN = totalAllocPoint.gt(BigNumber.from("0")) ?
                poolAllocPoint.mul(farmPerSecondBN).div(totalAllocPoint) : BigNumber.from("0");

              return <>
                <Row style={{ marginTop: "20px" }}>
                  <Col span={4}>
                    {
                      chainId && <>
                        <ERC20TokenLogoComponent style={{ width: "32px", height: "32px", marginTop: "-14px" }} chainId={chainId} address={pair.token0.address} />
                        <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", marginLeft: "-12px" }} chainId={chainId} address={pair.token1.address} />
                      </>
                    }
                  </Col>
                  <Col span={18} style={{ lineHeight: "10px" }}>
                    <Text style={{ fontSize: "12px" }} strong>{TokenSymbol(pair.token0)} / </Text>
                    <Text style={{ fontSize: "12px" }} strong>{TokenSymbol(pair.token1)}</Text>
                    <Slider onChange={(value) => {
                      poolAllocPointMap[poolInfo.pid] = BigNumber.from(value)
                      setPoolAllocPointMap({
                        ...poolAllocPointMap,
                      })
                    }} value={poolAllocPoint.toNumber()} style={{ marginTop: "5px" }} />
                  </Col>
                  <Col span={2} style={{ textAlign: "center" }}>
                    <Text strong style={{ marginLeft: "5px", marginTop: "15px" }} >{poolAllocPoint.toNumber()}</Text>
                  </Col>
                  <Col span={24}>
                    {
                      RenderSpeedIntervals(poolPerSecondBN)
                    }
                  </Col>
                </Row>
              </>
            })
          }
        </Col>
      </Row >
      <Divider />
      <Row>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doEditFarm();
            }} disabled={!editable} type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_broadcast")}
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_sending")}
            </Button>
          }
          {
            render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
              {t("wallet_send_status_close")}
            </Button>
          }
        </Col>
      </Row>
    </Modal >
  </>

}
