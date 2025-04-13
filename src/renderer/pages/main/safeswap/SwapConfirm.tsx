import { Button, Col, Divider, Modal, Row, Typography } from "antd"
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import { ArrowDownOutlined, SendOutlined, SwapLeftOutlined } from "@ant-design/icons";
import { Pair, Percent, Token, TokenAmount, Trade, TradeType } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useContract, useSafeswapV2Router } from "../../../hooks/useContracts";
import { useSafeswapSlippageTolerance, useTimestamp } from "../../../state/application/hooks";
import { ethers } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { getSlippageTolerancePercent } from "./Swap";

const { Text } = Typography;

export default ({
  openSwapConfirmModal, setOpenSwapConfirmModal,
  tokenA, tokenB,
  tokenInAmount, tokenOutAmount,
  trade
}: {
  openSwapConfirmModal: boolean,
  setOpenSwapConfirmModal: (openSwapConfirmModal: boolean) => void,
  tokenA: undefined | Token,
  tokenB: undefined | Token,
  tokenInAmount: string,
  tokenOutAmount: string,
  trade: Trade
}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const SwapV2RouterContract = useSafeswapV2Router(true);
  const timestamp = useTimestamp();
  const activeAccount = useWalletsActiveAccount();
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
  const cancel = useCallback(() => {
    setOpenSwapConfirmModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);
  const slippageTolerance = useSafeswapSlippageTolerance();
  const slippage = getSlippageTolerancePercent(slippageTolerance);

  const swap = () => {
    if (SwapV2RouterContract) {
      setSending(true);

      const path = trade.route.path.map(token => token.address);
      const tradeType: TradeType = trade.tradeType;
      const deadline = timestamp + 60 * 10;
      const to = activeAccount;

      if (tradeType == TradeType.EXACT_INPUT) {
        const amountIn = ethers.BigNumber.from(trade.inputAmount.raw.toString());
        const amountOutMin = ethers.BigNumber.from(trade.minimumAmountOut(slippage).raw.toString());
        if (tokenA && tokenB) {
          SwapV2RouterContract.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0",
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err)
            setErr(err)
          })
        } else if (tokenA == undefined && tokenB) {
          SwapV2RouterContract.swapExactETHForTokens(
            amountOutMin,
            path,
            to,
            deadline,
            { value: amountIn }
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: amountIn.toString(),
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err);
            setErr(err);
          })
        } else if (tokenB == undefined && tokenA) {
          SwapV2RouterContract.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0",
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err)
            setErr(err)
          })
        }
      } else if (tradeType == TradeType.EXACT_OUTPUT) {
        const amountOut = ethers.BigNumber.from(trade.outputAmount.raw.toString());
        const amountInMax = ethers.BigNumber.from(trade.maximumAmountIn(slippage).raw.toString());
        if (tokenA && tokenB) {
          SwapV2RouterContract.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0",
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err)
            setErr(err)
          })
        } else if (tokenA == undefined && tokenB) {
          SwapV2RouterContract.swapETHForExactTokens(
            amountOut,
            path,
            activeAccount,
            deadline,
            {
              value: amountInMax // 发送的 ETH
            }
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: amountInMax.toString(),
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err)
            setErr(err)
          })
        } else if (tokenB == undefined && tokenA) {
          SwapV2RouterContract.swapTokensForExactETH(
            amountOut,
            amountInMax,
            path,
            activeAccount,
            deadline
          ).then((response: any) => {
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: SwapV2RouterContract.address }, response, {
              call: {
                from: activeAccount,
                to: SwapV2RouterContract.address,
                input: data,
                value: "0",
              }
            });
            setTxHash(hash);
          }).catch((err: any) => {
            console.log("Swap Error =", err)
            setErr(err)
          })
        }
      }
    }
  }

  const RenderPrice = () => {
    const price = trade?.executionPrice;
    return <>
      {
        price && <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text type="secondary">价格</Text>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.toSignificant(4)}</Text> {tokenB ? tokenB.symbol : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenA ? tokenA.symbol : "SAFE"}</Text>
            </Col>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.invert().toSignificant(4)}</Text> {tokenA ? tokenA.symbol : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenB ? tokenB.symbol : "SAFE"}</Text>
            </Col>
          </Col>
        </Row>
      }
    </>
  }

  const RenderSwapSplippageTip = () => {
    const tradeType = trade.tradeType;
    if (tradeType == TradeType.EXACT_INPUT) {
      const amountOutMin = trade.minimumAmountOut(slippage);
      return <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text italic>
            兑换结果是预估的,您将最少得到 <Text strong>{amountOutMin.toSignificant()} {tokenB ? tokenB.symbol : "SAFE"}</Text>或者这笔交易将会被撤回
          </Text>
        </Col>
      </Row>
    } else if (tradeType == TradeType.EXACT_OUTPUT) {
      const amountInMax = trade.maximumAmountIn(slippage);
      return <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text italic>
            兑换结果是预估的,您将最多支付 <Text strong>{amountInMax.toSignificant()} {tokenA ? tokenA.symbol : "SAFE"}</Text>或者这笔交易将会被撤回
          </Text>
        </Col>
      </Row>
    }
    return <></>
  }

  return <>
    <Modal title="确认交易" footer={null} open={openSwapConfirmModal} destroyOnClose onCancel={cancel} >
      <Divider />
      {
        render
      }
      <Row>
        <Col span={3}>
          {
            tokenA ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={tokenA.address} chainId={tokenA.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text style={{ fontSize: "24px", lineHeight: "40px" }}>
            -  {trade.inputAmount.toSignificant()} {tokenA ? tokenA.symbol : "SAFE"}
          </Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ArrowDownOutlined style={{ fontSize: "24px", marginLeft: "7px", marginTop: "12px" }} />
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={3}>
          {
            tokenB ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={tokenB.address} chainId={tokenB.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text type="success" style={{ fontSize: "24px", lineHeight: "40px" }}>
            + {trade.outputAmount.toSignificant()} {tokenB ? tokenB.symbol : "SAFE"}
          </Text>
        </Col>
      </Row>
      {
        RenderSwapSplippageTip()
      }
      {
        RenderPrice()
      }
      <Divider />

      <Row>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              swap();
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
