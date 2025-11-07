import { Alert, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import { ArrowDownOutlined, SendOutlined, SwapLeftOutlined, SyncOutlined } from "@ant-design/icons";
import { Pair, Percent, Token, TokenAmount, Trade, TradeType } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useContract, useSafeswapV2Router, useWSAFEContract } from "../../../hooks/useContracts";
import { useSafeswapSlippageTolerance, useTimestamp } from "../../../state/application/hooks";
import { Contract, ethers } from "ethers";
import { useTokenAllowanceAmounts, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { getSlippageTolerancePercent } from "./Swap";
import { IERC20_Interface } from "../../../abis";
import TokenSymbol from "../../components/TokenSymbol";
import EstimateTx from "../../../utils/EstimateTx";

const { Text, Link } = Typography;

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
  trade: Trade | undefined
}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const SwapV2RouterContract = useSafeswapV2Router(true);
  const WSAFEContract = useWSAFEContract(true);
  const timestamp = useTimestamp();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const { provider, chainId } = useWeb3React();
  const tokenAContract = tokenA ? new Contract(tokenA.address, IERC20_Interface, provider) : undefined;
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

  const doSwap = () => {
    trade ? swap() : wrapOrUnwrap();
  }

  const tokenAllowanceAmounts = tokenA && useTokenAllowanceAmounts(activeAccount, SafeswapV2RouterAddress, [tokenA]);
  const allowanceForRouterOfTokenA = useMemo(() => {
    return tokenAllowanceAmounts && tokenA ? tokenAllowanceAmounts[tokenA.address] : undefined;
  }, [tokenA, tokenAllowanceAmounts]);

  const needApproveTokenA = useMemo(() => {
    if (tokenA && tokenInAmount && allowanceForRouterOfTokenA && trade) {
      const inAmount = new TokenAmount(tokenA, ethers.utils.parseUnits(tokenInAmount, tokenA.decimals).toBigInt());
      return inAmount.greaterThan(allowanceForRouterOfTokenA)
    }
    return false;
  }, [allowanceForRouterOfTokenA, tokenInAmount, tokenA, trade]);

  const [approveTokenHash, setApproveTokenHash] = useState<{
    [address: string]: {
      execute: boolean,
      hash?: string
    }
  }>({});
  const approveRouter = useCallback(async () => {
    if (tokenA && activeAccount && tokenAContract && trade && provider && chainId) {
      setApproveTokenHash({
        ...approveTokenHash,
        [tokenA.address]: {
          execute: true
        }
      })
      const amountIn = ethers.BigNumber.from(trade.inputAmount.raw.toString());
      // 更新为最大值授权,避免每次用一点授权一点..
      const data = tokenAContract.interface.encodeFunctionData("approve", [
        SafeswapV2RouterAddress, ethers.constants.MaxUint256 //amountIn
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: tokenAContract.address,
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
        setApproveTokenHash({
          ...approveTokenHash,
          [tokenA.address]: {
            hash,
            execute: true
          }
        })
      }
    }
  }, [activeAccount, tokenA, tokenAContract, trade]);

  const wrapOrUnwrap = async () => {
    if (WSAFEContract && provider && chainId) {
      let value = ethers.constants.Zero;
      let data: string | undefined = undefined;
      if (tokenA == undefined && tokenB) {
        value = ethers.utils.parseEther(tokenInAmount);
        data = WSAFEContract.interface.encodeFunctionData("deposit", []);
      } else if (tokenB == undefined && tokenA) {
        const withdrawValue = ethers.utils.parseEther(tokenInAmount);
        data = WSAFEContract.interface.encodeFunctionData("withdraw", [withdrawValue]);
      }
      if (!data) return;
      setSending(true);
      let tx: ethers.providers.TransactionRequest = {
        to: WSAFEContract.address,
        data,
        chainId,
        value
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
          addTransaction({ to: WSAFEContract.address }, response, {
            call: {
              from: activeAccount,
              to: WSAFEContract.address,
              input: data,
              value: value.toString(),
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
        setErr(error);
        setSending(false);
      }
    }
  }

  const swap = async () => {
    if (SwapV2RouterContract && trade && provider && chainId) {
      setSending(true);
      const path = trade.route.path.map(token => token.address);
      const tradeType: TradeType = trade.tradeType;
      const deadline = timestamp + 60 * 10;
      const to = activeAccount;

      let value = ethers.constants.Zero;
      let data: string | undefined = undefined;

      if (tradeType == TradeType.EXACT_INPUT) {
        const amountIn = ethers.BigNumber.from(trade.inputAmount.raw.toString());
        const amountOutMin = ethers.BigNumber.from(trade.minimumAmountOut(slippage).raw.toString());
        if (tokenA && tokenB) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapExactTokensForTokens", [
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
          ]);
        } else if (tokenA == undefined && tokenB) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapExactETHForTokens", [
            amountOutMin,
            path,
            to,
            deadline
          ]);
          value = amountIn;
        } else if (tokenB == undefined && tokenA) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapExactTokensForETH", [
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
          ]);
        }
      } else if (tradeType == TradeType.EXACT_OUTPUT) {
        const amountOut = ethers.BigNumber.from(trade.outputAmount.raw.toString());
        const amountInMax = ethers.BigNumber.from(trade.maximumAmountIn(slippage).raw.toString());
        if (tokenA && tokenB) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapTokensForExactTokens", [
            amountOut,
            amountInMax,
            path,
            to,
            deadline
          ]);
        } else if (tokenA == undefined && tokenB) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapETHForExactTokens", [
            amountOut,
            path,
            activeAccount,
            deadline
          ]);
          value = amountInMax;
        } else if (tokenB == undefined && tokenA) {
          data = SwapV2RouterContract.interface.encodeFunctionData("swapTokensForExactETH", [
            amountOut,
            amountInMax,
            path,
            activeAccount,
            deadline
          ]);
        }
      }

      if (!data) return;
      let tx: ethers.providers.TransactionRequest = {
        to: SwapV2RouterContract.address,
        data,
        chainId,
        value
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
          addTransaction({ to: SwapV2RouterContract.address }, response, {
            call: {
              from: activeAccount,
              to: SwapV2RouterContract.address,
              input: data,
              value: value.toString(),
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
        setErr(error);
        setSending(false);
      }

    }
  }

  const RenderPrice = () => {
    const price = trade?.executionPrice;
    return <>
      {
        price && <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text type="secondary">{t("wallet_safeswap_price")}</Text>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.toSignificant(4)}</Text> {tokenB ? TokenSymbol(tokenB) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenA ? TokenSymbol(tokenA) : "SAFE"}</Text>
            </Col>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price.invert().toSignificant(4)}</Text> {tokenA ? TokenSymbol(tokenA) : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenB ? TokenSymbol(tokenB) : "SAFE"}</Text>
            </Col>
          </Col>
        </Row>
      }
    </>
  }

  const RenderSwapSplippageTip = () => {
    if (trade) {
      const tradeType = trade.tradeType;
      if (tradeType == TradeType.EXACT_INPUT) {
        const amountOutMin = trade.minimumAmountOut(slippage);
        return <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text italic>
              {t("wallet_safeswap_traderesulttip0")} <Text strong>{amountOutMin.toSignificant()} {tokenB ? TokenSymbol(tokenB) : "SAFE"}</Text> {t("wallet_safeswap_traderesulttip1")}
            </Text>
          </Col>
        </Row>
      } else if (tradeType == TradeType.EXACT_OUTPUT) {
        const amountInMax = trade.maximumAmountIn(slippage);
        return <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text italic>
              {t("wallet_safeswap_traderesulttip2")} <Text strong>{amountInMax.toSignificant()} {tokenA ? TokenSymbol(tokenA) : "SAFE"}</Text> {t("wallet_safeswap_traderesulttip0")}
            </Text>
          </Col>
        </Row>
      }
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
            {
              trade && <>
                -  {trade.inputAmount.toSignificant()} {tokenA ? TokenSymbol(tokenA) : "SAFE"} {tokenA ? <Text code>SRC20</Text> : <></>}
              </>
            }
            {
              !trade && <>
                -  {tokenInAmount} {tokenA ? TokenSymbol(tokenA) : "SAFE"} {tokenA ? <Text code>SRC20</Text> : <></>}
              </>
            }
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
          <Text type="success" style={{ fontSize: "24px", lineHeight: "48px" }}>
            {
              trade && <>
                + {trade.outputAmount.toSignificant()} {tokenB ? TokenSymbol(tokenB) : "SAFE"} {tokenB ? <Text code>SRC20</Text> : <></>}
              </>
            }
            {
              !trade && <>
                + {tokenOutAmount} {tokenB ? TokenSymbol(tokenB) : "SAFE"} {tokenB ? <Text code>SRC20</Text> : <></>}
              </>
            }
          </Text>
        </Col>
      </Row>
      {
        RenderSwapSplippageTip()
      }
      {
        RenderPrice()
      }
      <Row style={{ marginTop: "20px" }}>
        {
          needApproveTokenA && tokenA && <Col span={24}>
            <Alert style={{ marginTop: "5px", marginBottom: "10px" }} type="warning" message={<>
              <Text>{t("wallet_safeswap_needapprovetoken", { spender: "Safeswap", tokenSymbol: tokenA ? TokenSymbol(tokenA) : "" })}</Text>
              <Link disabled={approveTokenHash[tokenA?.address]?.execute} onClick={approveRouter} style={{ float: "right" }}>
                {
                  approveTokenHash[tokenA?.address]?.execute && <SyncOutlined spin />
                }
                {
                  approveTokenHash[tokenA?.address] ? t("wallet_safeswap_approving") : t("wallet_safeswap_clicktoapprove")
                }
              </Link>
            </>} />
          </Col>
        }
      </Row>
      <Divider />

      <Row>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} disabled={needApproveTokenA} onClick={() => {
              doSwap();
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
