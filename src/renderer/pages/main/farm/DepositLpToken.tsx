import { Alert, Button, Col, Divider, InputNumberProps, Modal, Row, Slider, Spin, Typography } from "antd"
import { Farm, MiniChefV2PoolInfoWithSafeswapPair } from "../../../hooks/useMiniChefV2"
import { useWeb3React } from "@web3-react/core";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useEffect, useMemo, useState } from "react";
import { Fraction, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import { useTranslation } from "react-i18next";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { useTokenAllowance, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { BigNumber, Contract, ethers } from "ethers";
import { ArrowDownOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";
import TokenSymbol from "../../components/TokenSymbol";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import { useMiniChefV2 } from "../../../hooks/useContracts";
import { IERC20_Interface } from "../../../abis";
import EstimateTx from "../../../utils/EstimateTx";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapTokens } from "../../../state/application/action";
import { SerializeToken } from "../safeswap/Swap";
import { Safe4NetworkChainId, WSAFE } from "../../../config";
import { calculateRewardSpeed, Default_Reward_Speed_Level } from "./FarmPools";

const { Text, Title, Link } = Typography;

export default ({
  openDepositModal, setOpenDepositModal,
  farm, pool,
}: {
  openDepositModal: boolean,
  setOpenDepositModal: (openDepositModal: boolean) => void,
  farm: Farm,
  pool: MiniChefV2PoolInfoWithSafeswapPair
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const cancel = () => {
    setOpenDepositModal(false);
  }
  const { pair, pairResult, poolInfo } = pool;
  const { token0, token1 } = pair;
  const liquidityToken = new Token(pair.liquidityToken.chainId, poolInfo.lpToken, pair.liquidityToken.decimals, pair.liquidityToken.name);

  const [userRewardPerLevelAmount, setUserRewardPerLevelAmount] = useState<Fraction | undefined>(
    calculateRewardSpeed(farm, pool, Default_Reward_Speed_Level)[1]
  );

  const { LPTokenAmount, token0Amount, token1Amount } = useMemo(() => {
    const {
      token0, token1,
    } = pair;
    const {
      reservers, totalSupply, balanceOf
    } = pairResult;
    const token0Reserver = new TokenAmount(token0, reservers[0].toBigInt());
    const token1Reserver = new TokenAmount(token1, reservers[1].toBigInt());
    // 用户持有流动性代币数量
    const LPTokenAmount = new TokenAmount(liquidityToken, balanceOf.toBigInt());
    // 流动性代币总供应
    const TotalLPTokenAmount = new TokenAmount(liquidityToken, totalSupply.toBigInt());
    // 用户持有占比
    const lpTokenRatio = LPTokenAmount.divide(TotalLPTokenAmount);
    // 基于占比，计算用户所拥有的存入代币数量
    const token0Amount = token0Reserver.multiply(lpTokenRatio);
    const token1Amount = token1Reserver.multiply(lpTokenRatio);
    return {
      LPTokenAmount,
      token0Amount, token1Amount,
      userRewardPerLevelAmount
    }
  }, [pairResult, pair, chainId]);
  const hasLPToken = useMemo(() => {
    return LPTokenAmount && LPTokenAmount.greaterThan(ZERO);
  }, [LPTokenAmount]);

  const [inputValue, setInputValue] = useState(0);
  const onChange: InputNumberProps['onChange'] = (newValue) => {
    setInputValue(newValue as number);
  };
  useEffect(() => { calculateRemove() }, [inputValue]);

  const [stake, setStake] = useState<{
    token0Stake: string,
    token1Stake: string,
    lpTokenStake: TokenAmount
  }>()

  const calculateRemove = () => {
    if (activeAccount && token0Amount && token1Amount && LPTokenAmount && chainId) {
      const removePercent = new Fraction(JSBI.BigInt(inputValue as number), JSBI.BigInt(100));
      let _token0Stake, _token1Stake, _lpTokenStake;
      if (!removePercent.equalTo(JSBI.BigInt(0))) {
        _token0Stake = token0Amount.multiply(removePercent);
        _token1Stake = token1Amount.multiply(removePercent);
        _lpTokenStake = LPTokenAmount.multiply(removePercent);

        setStake({
          token0Stake: ViewFiexdAmount(_token0Stake, token0, 6),
          token1Stake: ViewFiexdAmount(_token1Stake, token1, 6),
          lpTokenStake: new TokenAmount(liquidityToken, ethers.utils.parseUnits(_lpTokenStake.toFixed(liquidityToken.decimals)).toBigInt()),
        })

        // 计算 [已存入 + 准备存入] 的 lptoken 所对应的当前用户的挖矿速率;
        const userNewLpTokenStakeAmount = ethers.utils.parseUnits(_lpTokenStake.toFixed(liquidityToken.decimals)).add(
          poolInfo.userInfo.amount
        );
        const [_, userRewardPerLevelAmount] = calculateRewardSpeed(farm, pool, Default_Reward_Speed_Level, userNewLpTokenStakeAmount);
        setUserRewardPerLevelAmount(userRewardPerLevelAmount);
      } else {
        setStake(undefined)
      }
    }
  }
  const miniChefV2Contract = useMiniChefV2();
  const allowanceForMiniChefV2OfLpToken = miniChefV2Contract && useTokenAllowance(liquidityToken, activeAccount, miniChefV2Contract.address);

  const needApprove = useMemo(() => {
    if (allowanceForMiniChefV2OfLpToken && stake && stake.lpTokenStake) {
      return stake.lpTokenStake.greaterThan(allowanceForMiniChefV2OfLpToken);
    }
    return false;
  }, [allowanceForMiniChefV2OfLpToken, stake]);

  const [executeApprove, setExecuteApproving] = useState<{
    hash?: string,
    executing: boolean
  } | undefined>(undefined);

  const doApproveMaxForMiniChefV2 = async () => {
    if (chainId && provider) {
      setExecuteApproving({
        executing: true
      });
      const data = IERC20_Interface.encodeFunctionData("approve", [
        miniChefV2Contract?.address, ethers.constants.MaxUint256
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: liquidityToken.address,
        data,
        chainId
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
          console.log("Approving Hash ==>", hash);
          setExecuteApproving({
            hash,
            executing: false
          });
        } catch (err) {
        } finally {
          setExecuteApproving({
            ...executeApprove,
            executing: false
          });
        }
      }
    }
  }

  const depositable = useMemo(() => {
    return !needApprove && stake?.lpTokenStake.greaterThan(ZERO);
  }, [needApprove, stake]);

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
  const doDeposit = async () => {
    if (!needApprove && (allowanceForMiniChefV2OfLpToken && stake?.lpTokenStake) && allowanceForMiniChefV2OfLpToken.greaterThan(stake.lpTokenStake)) {
      if (miniChefV2Contract && chainId && provider) {
        setSending(true);
        /**
         * deposit(uint256,uint256,address) [pid , amount , to]
         */
        const data = miniChefV2Contract.interface.encodeFunctionData("deposit", [
          poolInfo.pid,
          BigNumber.from(stake.lpTokenStake.raw.toString()),
          activeAccount
        ]);
        let tx: ethers.providers.TransactionRequest = {
          to: miniChefV2Contract.address,
          data,
          chainId,
        };
        try {
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
            setTxHash(hash);
          }
          if (error) {
            setErr(error)
          }
        } catch (err: any) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
    }
  }

  const RenderTitle = () => {
    return <>
      {
        chainId && <>
          <ERC20TokenLogoComponent style={{ width: "32px", height: "32px", marginTop: "-14px" }} chainId={chainId} address={pair.token0.address} />
          <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", marginLeft: "-12px" }} chainId={chainId} address={pair.token1.address} />
        </>
      }
      <Divider type="vertical" />
      <Text strong style={{ fontSize: "24px" }}>质押流动性</Text>
    </>
  }

  const goToAddLiquidity = () => {
    if (chainId) {
      cancel();
      navigate("/main/swap");
      const tokenA = token0 && [
        WSAFE[Safe4NetworkChainId.Testnet].address,
        WSAFE[Safe4NetworkChainId.Mainnet].address
      ].indexOf(token0.address) < 0 ? SerializeToken(token0) : undefined;
      const tokenB = token1 && [
        WSAFE[Safe4NetworkChainId.Testnet].address,
        WSAFE[Safe4NetworkChainId.Mainnet].address
      ].indexOf(token1.address) < 0 ? SerializeToken(token1) : undefined;
      dispatch(applicationUpdateSafeswapTokens({
        chainId,
        tokenA,
        tokenB,
        action: "AddLiquidity"
      }));
    }
  }

  return <Modal width={"600px"} title={RenderTitle()} open={openDepositModal} onCancel={cancel} footer={null} destroyOnClose>
    <Divider />
    {
      render
    }
    <Row>

      {
        !hasLPToken && <>
          <Col span={24} style={{ marginBottom: "20px" }}>
            <Alert message={<>
              <Text>您还没有添加
                <Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>
                  {TokenSymbol(token0)}/{TokenSymbol(token1)}
                </Text>
                流动性,请先添加流动性;</Text>
              <Link onClick={goToAddLiquidity} style={{ float: "right" }}>添加流动性</Link>
            </>} />
          </Col>
        </>
      }

      <Col span={24}>
        <Text type="secondary" strong>{t("wallet_safeswap_liquidity_removeamount")}</Text>
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
        <Text type="secondary" strong>您将质押的流动性</Text>
        <Row>
          <Col span={12}>
            <Text style={{ fontSize: "24px" }}>- {stake?.token0Stake}</Text>
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
            <Text style={{ fontSize: "24px" }}>- {stake?.token1Stake}</Text>
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

    </Row>
    <Divider />
    <Row>
      {
        needApprove &&
        <Col span={24} style={{ marginBottom: "20px" }}>
          <Alert type="warning" message={<>
            <Row>
              <Col span={16}>
                需要先授权访问您的流动性
              </Col>
              <Col style={{ textAlign: "right" }} span={8}>
                <Link disabled={executeApprove != undefined} onClick={doApproveMaxForMiniChefV2}>
                  {
                    executeApprove && <SyncOutlined spin />
                  }
                  {
                    executeApprove ? "正在授权" : "点击授权"
                  }
                </Link>
              </Col>
            </Row>
          </>} />
        </Col>
      }

      <Col span={24}>
        {
          !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
            doDeposit();
          }} type="primary" disabled={!depositable} style={{ float: "right" }}>
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

}
