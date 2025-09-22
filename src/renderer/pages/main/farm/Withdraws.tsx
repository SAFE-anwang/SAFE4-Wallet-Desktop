import { useTranslation } from "react-i18next";
import { Farm, MiniChefV2PoolInfoWithSafeswapPair } from "../../../hooks/useMiniChefV2"
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Fraction, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { Alert, Button, Col, Divider, InputNumberProps, Modal, Radio, Row, Slider, Typography } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import { useEffect, useMemo, useState } from "react";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { ArrowDownOutlined, SendOutlined } from "@ant-design/icons";
import { useMiniChefV2 } from "../../../hooks/useContracts";
import { BigNumber, ethers } from "ethers";
import EstimateTx from "../../../utils/EstimateTx";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import TokenSymbol from "../../components/TokenSymbol";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { calculateRewardSpeed, Default_Reward_Speed_Level } from "./FarmPools";

const { Text, Title, Link } = Typography;

enum Withdraw_Type {
  Withdraw_Rewards = "Withdraw_Rewards",
  Withdraw_LpToken = "Withdraw_LpToken",
  Withdraw_Emergency = "Withdraw_Emergency"
}

export default ({
  openWithdrawModal, setOpenWithdrawModal,
  farm, pool,
}: {
  openWithdrawModal: boolean,
  setOpenWithdrawModal: (openWithdrawModal: boolean) => void,
  farm: Farm,
  pool: MiniChefV2PoolInfoWithSafeswapPair
}) => {

  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const miniChefV2Contract = useMiniChefV2();
  const cancel = () => {
    setOpenWithdrawModal(false);
  }
  const { pair, pairResult, poolInfo } = pool;
  const { token0, token1 } = pair;
  const liquidityToken = new Token(pair.liquidityToken.chainId, poolInfo.lpToken, pair.liquidityToken.decimals, pair.liquidityToken.name);
  const pendingSushiAmount = new TokenAmount(liquidityToken, poolInfo.pendingSushi.toBigInt());
  const { lpTokenStakeAmount, token0Amount, token1Amount } = useMemo(() => {
    const {
      token0, token1,
    } = pair;
    const {
      reservers, totalSupply
    } = pairResult;
    const token0Reserver = new TokenAmount(token0, reservers[0].toBigInt());
    const token1Reserver = new TokenAmount(token1, reservers[1].toBigInt());
    // 用户当前已质押的流动性代币数量
    const lpTokenStakeAmount = new TokenAmount(liquidityToken, poolInfo.userInfo.amount.toBigInt());
    // 流动性代币总供应
    const TotalLPTokenAmount = new TokenAmount(liquidityToken, totalSupply.toBigInt());
    // 用户持有占比
    const lpTokenRatio = lpTokenStakeAmount.divide(TotalLPTokenAmount);
    // 基于占比，计算用户所拥有的存入代币数量
    const token0Amount = token0Reserver.multiply(lpTokenRatio);
    const token1Amount = token1Reserver.multiply(lpTokenRatio);
    return {
      lpTokenStakeAmount,
      token0Amount, token1Amount
    }
  }, [pairResult, pair, chainId]);

  const [inputValue, setInputValue] = useState(0);
  const onChange: InputNumberProps['onChange'] = (newValue) => {
    setInputValue(newValue as number);
  };
  useEffect(() => { calculateRemove() }, [inputValue]);

  const [remove, setRemove] = useState<{
    token0Remove: string,
    token1Remove: string,
    lpTokenRemove: TokenAmount
  }>()
  const calculateRemove = () => {
    if (activeAccount && token0Amount && token1Amount && lpTokenStakeAmount && chainId) {
      const removePercent = new Fraction(JSBI.BigInt(inputValue as number), JSBI.BigInt(100));
      let _token0Remove, _token1Remove, _lpTokenRemove;
      if (!removePercent.equalTo(JSBI.BigInt(0))) {
        _token0Remove = token0Amount.multiply(removePercent);
        _token1Remove = token1Amount.multiply(removePercent);
        _lpTokenRemove = lpTokenStakeAmount.multiply(removePercent);
        setRemove({
          token0Remove: ViewFiexdAmount(_token0Remove, token0, 6),
          token1Remove: ViewFiexdAmount(_token1Remove, token1, 6),
          lpTokenRemove: new TokenAmount(liquidityToken, ethers.utils.parseUnits(_lpTokenRemove.toFixed(liquidityToken.decimals)).toBigInt()),
        })

        // 计算 [已存入 + 准备存入] 的 lptoken 所对应的当前用户的挖矿速率;
        const userNewLpTokenStakeAmount = poolInfo.userInfo.amount.sub(
          ethers.utils.parseUnits(_lpTokenRemove.toFixed(liquidityToken.decimals))
        )
        const [_, userRewardPerLevelAmount] = calculateRewardSpeed(farm, pool, Default_Reward_Speed_Level, userNewLpTokenStakeAmount);
        setUserRewardPerLevelAmount(userRewardPerLevelAmount);
      } else {
        setRemove(undefined)
      }
    }
  }

  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const [userRewardPerLevelAmount, setUserRewardPerLevelAmount] = useState<Fraction | undefined>(
    calculateRewardSpeed(farm, pool, Default_Reward_Speed_Level)[1]
  );

  const RenderTitle = () => {
    return <>
      {
        chainId && <>
          <ERC20TokenLogoComponent style={{ width: "32px", height: "32px", marginTop: "-14px" }} chainId={chainId} address={pair.token0.address} />
          <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", marginLeft: "-12px" }} chainId={chainId} address={pair.token1.address} />
        </>
      }
      <Divider type="vertical" />
      <Text strong style={{ fontSize: "24px" }}>提现</Text>
    </>
  }

  const finishedWithdraw = response != undefined;

  const options: CheckboxGroupProps<string>['options'] = [
    { label: '提现奖励', value: Withdraw_Type.Withdraw_Rewards },
    { label: '提现流动性', value: Withdraw_Type.Withdraw_LpToken },
    { label: '紧急提现', value: Withdraw_Type.Withdraw_Emergency },
  ];
  const [withdrawType, setWithdrawType] = useState<Withdraw_Type>(Withdraw_Type.Withdraw_Rewards);

  const doWithdraw = async () => {
    if (miniChefV2Contract && chainId && provider) {
      let data: string | undefined;
      if (withdrawType == Withdraw_Type.Withdraw_Rewards) {
        // harvest(uint256,address)
        data = miniChefV2Contract.interface.encodeFunctionData("harvest", [
          poolInfo.pid,
          activeAccount
        ]);
      }
      if (withdrawType == Withdraw_Type.Withdraw_LpToken && remove && remove.lpTokenRemove.greaterThan(ZERO)) {
        // withdraw(uint256,uint256,address)
        data = miniChefV2Contract.interface.encodeFunctionData("withdraw", [
          poolInfo.pid,
          BigNumber.from(remove.lpTokenRemove.raw.toString()),
          activeAccount
        ]);
      }
      if (withdrawType == Withdraw_Type.Withdraw_Emergency) {
        // emergencyWithdraw(uint256,address)
        data = miniChefV2Contract.interface.encodeFunctionData("emergencyWithdraw", [
          poolInfo.pid,
          activeAccount
        ]);
      }
      if (data != undefined) {
        setSending(true);
        try {
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
          }
          if (error) {
            setErr(error)
          }
        } catch (err) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
    }
  }

  return <>
    <Modal width={"600px"} title={RenderTitle()} open={openWithdrawModal} onCancel={cancel} footer={null} destroyOnClose>
      <Divider />
      {
        render
      }
      <Row>
        <Col span={24}>
          <Text type="secondary" strong>提现方式</Text>
        </Col>
        <Col span={24} style={{ marginTop: "10px" }}>
          <Radio.Group disabled={response != undefined} onChange={(event) => {
            setWithdrawType(event.target.value);
            if (event.target.value == Withdraw_Type.Withdraw_Emergency) {
              setInputValue(100);
            } else {
              setInputValue(0);
            }
          }} options={options} value={withdrawType} defaultValue={Withdraw_Type.Withdraw_Rewards} />
        </Col>
        <Col span={24} style={{ marginTop: "10px" }}>
          {
            withdrawType == Withdraw_Type.Withdraw_Rewards &&
            <Alert message={<>
              将您质押在流动性挖矿池中产生的奖励代币提现到您的账户
            </>} />
          }
          {
            withdrawType == Withdraw_Type.Withdraw_LpToken &&
            <Alert message={<>
              将您质押在流动性挖矿池中的流动性代币提现,矿池会根据您的流动性占比重新计算您在该矿池中的奖励速率
            </>} />
          }
          {
            withdrawType == Withdraw_Type.Withdraw_Emergency &&
            <Alert showIcon type="warning" message={<>
              <Text>若发生矿池无法领取奖励或者存在其他风险,可通过该方式提现您的流动性代币</Text>
              <br />
              <Text strong>此方式提现流动性代币,将自动放弃您在该挖矿池中奖励</Text>
            </>} />
          }
        </Col>
      </Row>

      <Row style={{ marginTop: "20px" }}>
        {
          withdrawType == Withdraw_Type.Withdraw_Rewards &&
          <>
            <Col span={24}>
              <Text type="secondary" strong>奖励</Text>
            </Col>
            <Col span={24}>
              <Text style={{ fontSize: "40px" }} type="success" strong> + {pendingSushiAmount.toSignificant(4)}</Text>
            </Col>
          </>
        }
        {
          (withdrawType == Withdraw_Type.Withdraw_LpToken || withdrawType == Withdraw_Type.Withdraw_Emergency) &&
          <>
            <Col span={24}>
              <Text type="secondary" strong>数量</Text>
            </Col>
            <Col span={24}>
              <Col span={24}>
                <Text strong style={{ fontSize: "60px" }}>{inputValue}%</Text>
              </Col>
              <Col span={24}>
                <Slider
                  disabled={finishedWithdraw || withdrawType == Withdraw_Type.Withdraw_Emergency}
                  min={0}
                  max={100}
                  onChange={onChange}
                  value={typeof inputValue === 'number' ? inputValue : 0}
                />
              </Col>
              <Col span={24}>
                <Row>
                  <Col span={6}>
                    <Button disabled={finishedWithdraw || withdrawType == Withdraw_Type.Withdraw_Emergency} onClick={() => setInputValue(25)} size="large" type="dashed">25%</Button>
                  </Col>
                  <Col span={6}>
                    <Button disabled={finishedWithdraw || withdrawType == Withdraw_Type.Withdraw_Emergency} onClick={() => setInputValue(50)} size="large" type="dashed">50%</Button>
                  </Col>
                  <Col span={6}>
                    <Button disabled={finishedWithdraw || withdrawType == Withdraw_Type.Withdraw_Emergency} onClick={() => setInputValue(75)} size="large" type="dashed">75%</Button>
                  </Col>
                  <Col span={6}>
                    <Button disabled={finishedWithdraw || withdrawType == Withdraw_Type.Withdraw_Emergency} onClick={() => setInputValue(100)} size="large" type="dashed">100%</Button>
                  </Col>
                </Row>
              </Col>
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <ArrowDownOutlined style={{ fontSize: "24px", color: "green", marginTop: "15px", marginBottom: "10px" }} />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary" strong>您将取回的流动性</Text>
              <Row>
                <Col span={12}>
                  <Text type="success" style={{ fontSize: "24px" }}>+ {remove?.token0Remove}</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text style={{ fontSize: "24px" }}>{TokenSymbol(token0)}</Text>
                  <div style={{ float: "right", marginTop: "2px", marginLeft: "5px", textAlign: "center" }}>
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
                  <Text type="success" style={{ fontSize: "24px" }}>+ {remove?.token1Remove}</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text style={{ fontSize: "24px" }}>{TokenSymbol(token1)}</Text>
                  <div style={{ float: "right", marginTop: "2px", marginLeft: "5px", textAlign: "center" }}>
                    {
                      chainId && token1 &&
                      <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "2px" }} chainId={chainId} address={token1.address} />
                    }
                  </div>
                </Col>
              </Row>
            </Col>


            {
              userRewardPerLevelAmount && <>
                <Col span={24} style={{ marginTop: "20px" }}>
                  <Text type="secondary" strong>奖励速率</Text>
                </Col>
                <Col span={24}>
                  <Text strong style={{ color: "#091e9ae0", fontSize: "20px" }} italic>{userRewardPerLevelAmount.toSignificant(4)}</Text>
                </Col>
              </>
            }

          </>
        }
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doWithdraw();
            }} type="primary" style={{ float: "right" }}>
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

    </Modal>

  </>

}
