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
  openRemoveConfirmModal, setOpenRemoveConfirmModal,
  token0, token1, token0Amount, token1Amount , nonce

}: {
  openRemoveConfirmModal: boolean,
  setOpenRemoveConfirmModal: (openRemoveConfirmModal: boolean) => void,
  token0: Token | undefined,
  token1: Token | undefined
  token0Amount: string,
  token1Amount: string,
  nonce : Number
}) => {

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

  const remove = () => {



  }

  return <Modal title="移除流动性" footer={null} open={openRemoveConfirmModal} destroyOnClose onCancel={() => setOpenRemoveConfirmModal(false)}>

    <Divider />
    {
      render
    }
    <Row>
      { JSON.stringify(nonce) }
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

  </Modal>


}
