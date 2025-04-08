import { Button, Col, Divider, Modal, Row, Typography } from "antd"
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import { ArrowDownOutlined, SendOutlined, SwapLeftOutlined } from "@ant-design/icons";
import { CurrencyAmount, Fraction, Token, TokenAmount } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useContract, useSafeswapV2Router } from "../../../hooks/useContracts";
import { useTimestamp } from "../../../state/application/hooks";
import { ethers, TypedDataDomain } from "ethers";
import { useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { calculatePairAddress } from "./Calculate";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { splitSignature } from "ethers/lib/utils";
import { Default_SlippageTolerance } from "./Swap";


const { Text } = Typography;

export default ({
  openRemoveConfirmModal, setOpenRemoveConfirmModal,
  token0, token1, token0Amount, token1Amount, nonce, removeLpTokenAmount, lpToken

}: {
  openRemoveConfirmModal: boolean,
  setOpenRemoveConfirmModal: (openRemoveConfirmModal: boolean) => void,
  token0: Token | undefined,
  token1: Token | undefined
  token0Amount: string,
  token1Amount: string,
  removeLpTokenAmount: Fraction,
  lpToken: Token,
  nonce: Number
}) => {

  const timestamp = useTimestamp();
  const { chainId } = useWeb3React();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const signer = useWalletsActiveSigner();
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
    setOpenRemoveConfirmModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash])

  const pairAddress = chainId && calculatePairAddress(token0, token1, chainId);
  const safeswapV2Router = useSafeswapV2Router();
  const SlippageTolerance = (100 - Number(Default_SlippageTolerance) * 100);

  const remove = async () => {
    if (pairAddress && chainId && signer && safeswapV2Router) {
      const domain: TypedDataDomain = {
        name: "Safeswap V2",
        version: "1",
        chainId: chainId,
        verifyingContract: pairAddress
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };
      const message = {
        owner: activeAccount,
        spender: SafeswapV2RouterAddress,
        value: ethers.constants.MaxUint256.toString(),
        nonce,
        deadline: timestamp + 300
      };
      const signature = await signer._signTypedData(domain, types, message);
      const { v, r, s } = splitSignature(signature);

      if (token0 && token1) {
        const amount0Desire = ethers.utils.parseUnits(token0Amount, token0?.decimals);
        const amount1Desire = ethers.utils.parseUnits(token1Amount, token1?.decimals);
        const amount0Min = amount0Desire.mul(SlippageTolerance).div(100);
        const amount1Min = amount1Desire.mul(SlippageTolerance).div(100);
        const removeLpAmount = ethers.utils.parseUnits(removeLpTokenAmount.toFixed(lpToken.decimals)).toBigInt();
        setSending(true);
        safeswapV2Router.removeLiquidityWithPermit(
          token0?.address,
          token1?.address,
          removeLpAmount,
          amount0Min,
          amount1Min,
          message.owner,
          message.deadline,
          true,
          v,
          r,
          s
        ).then((response: any) => {
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: safeswapV2Router.address }, response, {
            call: {
              from: activeAccount,
              to: safeswapV2Router.address,
              input: data,
              value: "0",
            }
          });
          setTxHash(hash);
          setSending(false);
        }).catch((err: any) => {
          console.log("Error =", err);
          setErr(err);
          setSending(false);
        })
      } else if (token0 == undefined && token1 != undefined) {

      } else if (token0 != undefined && token1 == undefined) {

      }
    }
  }

  return <Modal title="移除流动性" footer={null} open={openRemoveConfirmModal} destroyOnClose onCancel={() => setOpenRemoveConfirmModal(false)}>

    <Divider />
    {
      render
    }
    <Row>
      <Col span={3}>
        {
          token0 ? <>
            <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={token0.address} chainId={token0.chainId} />
          </> : <>
            <TokenLogo width="40px" height="40px" />
          </>
        }
      </Col>
      <Col span={21}>
        <Text style={{ fontSize: "24px", lineHeight: "40px" }}>
          - {token0Amount} {token0 ? token0.symbol : "SAFE"}
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
          token1 ? <>
            <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={token1.address} chainId={token1.chainId} />
          </> : <>
            <TokenLogo width="40px" height="40px" />
          </>
        }
      </Col>
      <Col span={21}>
        <Text type="success" style={{ fontSize: "24px", lineHeight: "40px" }}>
          + {token1Amount} {token1 ? token1.symbol : "SAFE"}
        </Text>
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        {
          !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
            remove();
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


}
