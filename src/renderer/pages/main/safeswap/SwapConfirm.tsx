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
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";


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
  tokenOutAmount: string
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
  }, [txHash])

  const swap = () => {
    if (SwapV2RouterContract) {
      setSending(true);
      if (tokenA == undefined && tokenB) {
        const amountOutMin = ethers.utils.parseUnits(tokenOutAmount, tokenB.decimals);
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
          console.log("Swap Error =", err)
        })
      } else if (tokenA && tokenB == undefined) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA.decimals);
        const amountOutMin = ethers.utils.parseUnits(tokenOutAmount);
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
        })
      } else if (tokenA && tokenB) {
        const amountIn = ethers.utils.parseUnits(tokenInAmount, tokenA.decimals);
        const amountOutMin = ethers.utils.parseUnits(tokenOutAmount, tokenB.decimals);
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
