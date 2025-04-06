import { Button, Col, Divider, Modal, Row, Typography } from "antd"
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import { ArrowDownOutlined, SendOutlined, SwapLeftOutlined } from "@ant-design/icons";
import { Token, TokenAmount } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useContract, useSafeswapV2Router } from "../../../hooks/useContracts";
import { useTimestamp } from "../../../state/application/hooks";
import { ethers } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { Default_SlippageTolerance, PriceType } from "./Swap";


const { Text } = Typography;

export default ({
  openSwapConfirmModal, setOpenSwapConfirmModal,
  tokenA, tokenB,
  tokenInAmount, tokenOutAmount
}: {
  openSwapConfirmModal: boolean,
  setOpenSwapConfirmModal: (openSwapConfirmModal: boolean) => void,
  tokenA: undefined | Token,
  tokenB: undefined | Token,
  tokenInAmount: string,
  tokenOutAmount: string,
  reservers: { [address: string]: any }
}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const SwapV2RouterContract = useSafeswapV2Router(true);
  const timestamp = useTimestamp();
  const { chainId } = useWeb3React();
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
  const SlippageTolerance = (100 - Number(Default_SlippageTolerance) * 100);

  const price = useMemo(() => {
    if (tokenInAmount && tokenOutAmount) {
      return {
        [PriceType.B2A]: (Number(tokenInAmount) / Number(tokenOutAmount)) ? (Number(tokenInAmount) / Number(tokenOutAmount)).toFixed(4) : undefined,
        [PriceType.A2B]: (Number(tokenOutAmount) / Number(tokenInAmount)) ? (Number(tokenOutAmount) / Number(tokenInAmount)).toFixed(4) : undefined
      }
    }
    return undefined;
  }, [tokenInAmount, tokenOutAmount]);

  const swap = () => {
    if (SwapV2RouterContract) {
      setSending(true);
      if (tokenA == undefined && tokenB) {
        const amountOut = ethers.utils.parseUnits(tokenOutAmount, tokenB.decimals);
        const amountOutMin = amountOut.mul(SlippageTolerance).div(100);
        const value = ethers.utils.parseEther(tokenInAmount);
        SwapV2RouterContract.swapExactETHForTokens(
          amountOutMin,
          [WSAFE[chainId as Safe4NetworkChainId].address, tokenB.address],
          activeAccount,
          timestamp + 100,
          { value }
        ).then((response: any) => {
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
        }).catch((err: any) => {
          console.log("Swap Error =", err);
          setErr(err);
        })
      } else if (tokenA && tokenB == undefined) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA.decimals);
        const amountOut = ethers.utils.parseUnits(tokenOutAmount);
        const amountOutMin = amountOut.mul(SlippageTolerance).div(100);
        SwapV2RouterContract.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          [tokenA.address, WSAFE[chainId as Safe4NetworkChainId].address],
          activeAccount,
          timestamp + 100,
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
      } else if (tokenA && tokenB) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA.decimals);
        const amountOut = ethers.utils.parseUnits(tokenOutAmount, tokenB.decimals);
        const amountOutMin = amountOut.mul(SlippageTolerance).div(100);
        SwapV2RouterContract.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [tokenA.address, tokenB.address],
          activeAccount,
          timestamp + 100,
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

  return <>
    <Modal title="互兑交易" footer={null} open={openSwapConfirmModal} destroyOnClose onCancel={() => setOpenSwapConfirmModal(false)} >
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
            - {tokenInAmount} {tokenA ? tokenA.symbol : "SAFE"}
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
            + {tokenOutAmount} {tokenB ? tokenB.symbol : "SAFE"}
          </Text>
        </Col>
      </Row>
      {
        price && <Row style={{ marginTop: "20px" }}>
          <Col span={24}>
            <Text type="secondary">价格</Text>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price[PriceType.A2B]}</Text> {tokenB ? tokenB.symbol : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenA ? tokenA.symbol : "SAFE"}</Text>
            </Col>
          </Col>
          <Col span={12}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text strong>{price[PriceType.B2A]}</Text> {tokenA ? tokenA.symbol : "SAFE"}
            </Col>
            <Col span={24} style={{ textAlign: "center" }}>
              <Text>1 {tokenB ? tokenB.symbol : "SAFE"}</Text>
            </Col>
          </Col>
        </Row>
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
