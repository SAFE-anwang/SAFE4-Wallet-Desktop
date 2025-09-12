import { Alert, Button, Col, Divider, InputNumberProps, Modal, Row, Slider, Typography } from "antd"
import { MiniChefV2PoolInfoWithSafeswapPair } from "../../../hooks/useMiniChefV2"
import { useWeb3React } from "@web3-react/core";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useEffect, useMemo, useState } from "react";
import { Fraction, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import { useTranslation } from "react-i18next";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { useTokenAllowance, useTokenAllowanceAmounts, useTokenAllowanceWithLoadingIndicator, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { ethers } from "ethers";
import { ArrowDownOutlined } from "@ant-design/icons";
import TokenSymbol from "../../components/TokenSymbol";
import ViewFiexdAmount from "../../../utils/ViewFiexdAmount";
import { useBlockNumber } from "../../../state/application/hooks";
import { useMiniChefV2 } from "../../../hooks/useContracts";
import { MiniChefV2 } from "../../../config";

const { Text, Title } = Typography;

export default ({
  openDepositModal, setOpenDepositModal,
  pool,
}: {
  openDepositModal: boolean,
  setOpenDepositModal: (openDepositModal: boolean) => void
  pool: MiniChefV2PoolInfoWithSafeswapPair
}) => {
  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const activeAccount = useWalletsActiveAccount();
  const cancel = () => {
    setOpenDepositModal(false);
  }
  const { pair, pairResult, poolInfo } = pool;
  const { token0, token1 } = pair;
  const liquidityToken = new Token(pair.liquidityToken.chainId, poolInfo.lpToken, pair.liquidityToken.decimals, pair.liquidityToken.name);
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
      token0Amount, token1Amount
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
      } else {
        setStake(undefined)
      }
    }
  }
  const miniChefV2Contract = useMiniChefV2();
  const allowanceForMiniChefV2OfLpToken = miniChefV2Contract && useTokenAllowance(liquidityToken, activeAccount, miniChefV2Contract.address);

  const needApprove = useMemo(() => {
    if (allowanceForMiniChefV2OfLpToken && stake) {
      return allowanceForMiniChefV2OfLpToken.greaterThan(stake.lpTokenStake)
    }
  }, [allowanceForMiniChefV2OfLpToken, stake]);

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

  return <Modal title={RenderTitle()} open={openDepositModal} onCancel={cancel} footer={null} destroyOnClose>
    {liquidityToken.address}
    <Divider />
    <Row>
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
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        <Alert type="warning" message={<>
          需要先授权访问您的流动性
        </>} />
      </Col>
      <Col span={24}>
        <Button>广播交易</Button>
      </Col>
    </Row>
  </Modal>

}
