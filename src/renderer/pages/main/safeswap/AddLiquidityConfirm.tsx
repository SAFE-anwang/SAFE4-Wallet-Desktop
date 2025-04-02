

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
  openAddConfirmModal, setOpenAddConfirmModal,
  tokenA, tokenB,
  tokenAAmount, tokenBAmount
}: {
  openAddConfirmModal: boolean,
  setOpenAddConfirmModal: (openAddConfirmModal: boolean) => void,
  tokenA: undefined | Token,
  tokenB: undefined | Token,
  tokenAAmount: string,
  tokenBAmount: string
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
    setOpenAddConfirmModal(false);
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
        const amountTokenDesired = ethers.utils.parseUnits(tokenBAmount, tokenB.decimals);
        const amountTokenMin = amountTokenDesired;
        const value = ethers.utils.parseEther(tokenAAmount);
        SwapV2RouterContract.addLiquidityETH(
          tokenB.address,
          amountTokenDesired,
          amountTokenMin,
          value.mul(995).div(1000),
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
        const amountTokenDesired = ethers.utils.parseUnits(tokenAAmount, tokenA.decimals);
        const amountTokenMin = amountTokenDesired;
        const value = ethers.utils.parseEther(tokenBAmount);
        SwapV2RouterContract.addLiquidityETH(
          tokenA.address,
          amountTokenDesired,
          amountTokenMin.mul(995).div(1000),
          value,
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
      } else if (tokenA && tokenB) {
        const amountADesired = ethers.utils.parseUnits(tokenAAmount, tokenA.decimals);
        const amountBDesired = ethers.utils.parseUnits(tokenBAmount, tokenB.decimals);
        const amountAMin = amountADesired.mul(995).div(1000);
        const amountBMin = amountBDesired.mul(995).div(1000);
        SwapV2RouterContract.addLiquidity(
          tokenA.address,
          tokenB.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
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
    <Modal title="添加流动性" footer={null} open={openAddConfirmModal} destroyOnClose onCancel={() => setOpenAddConfirmModal(false)} >
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
            - {tokenAAmount} {tokenA ? tokenA.symbol : "SAFE"}
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
            + {tokenBAmount} {tokenB ? tokenB.symbol : "SAFE"}
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
