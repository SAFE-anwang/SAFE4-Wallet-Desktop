import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Avatar, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getNetworkLogo, NetworkType } from "../../../../assets/logo/NetworkLogo";
import { Safe4_Network_Config } from "../../../../config";
import { useIERC20Contract } from "../../../../hooks/useContracts";
import { useTokenAllowance, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import ERC20TokenLogoComponent from "../../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../../components/TokenLogo";
import { ethers } from "ethers";

const { Text, Link } = Typography;

export default ({
  token, amount, targetNetwork, targetAddress,
  openCrosschainConfirmModal,
  cancel
}: {
  token: string,
  amount: string,
  targetNetwork: NetworkType,
  targetAddress: string,
  openCrosschainConfirmModal: boolean,
  cancel: () => void
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const tokenUSDT = useMemo(() => {
    if (chainId && chainId == Safe4_Network_Config.Testnet.chainId) {
      return Safe4_Network_Config.Testnet.USDT;
    } else {
      return Safe4_Network_Config.Mainnet.USDT;
    }
  }, [chainId]);
  const USDT_Contract = useIERC20Contract(tokenUSDT.address, true);

  const CrossChain_Address = "0xd79ba37f30C0a22D9eb042F6B9537400A4668ff1";
  const callAllowance = useTokenAllowance(tokenUSDT, activeAccount, CrossChain_Address);

  const allowance = useMemo(() => {
    if (token == 'USDT') {
      if (callAllowance) {
        const _amount = new TokenAmount(tokenUSDT, amount);
        return {
          value: callAllowance,
          needApprove: _amount.greaterThan(callAllowance),
        }
      }
      return {
        value: undefined,
        needApprove: true,
      }
    }
    return {
      value: undefined,
      needApprove: false,
    }
  }, [token, amount, callAllowance]);

  const [approve, setApprove] = useState<{
    hash?: string,
    executing?: boolean
  }>({
    hash: undefined,
    executing: false
  });

  const doApproveMAX = useCallback(() => {
    if (USDT_Contract) {
      setApprove({
        hash: undefined,
        executing: true
      })
      USDT_Contract.approve(CrossChain_Address, ethers.constants.MaxUint256)
        .then((response: any) => {
          const { hash, data } = response;
          setApprove({
            hash,
            executing: true
          })
        })
    }
  }, [USDT_Contract]);

  const doCrosschain = () => {
    if ( token == 'USDT' ){
      console.log("Do Crosschain for USDT");
    } else if ( token == 'SAFE' ){
      console.log("Do Crosschain for SAFE");
    }
  }

  return <Modal footer={null} destroyOnClose title={t("wallet_crosschain")} open={openCrosschainConfirmModal} onCancel={cancel}>
    <Divider />
    <Row>
      <Col span={24}>
        <SyncOutlined style={{ fontSize: "32px" }} />
        <Text style={{ fontSize: "32px", marginLeft: "5px" }} strong>{amount} {token}</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_from")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Row>
          <Col span={3} style={{ paddingTop: "5px" }}>
            {
              chainId && token == "USDT" &&
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px" }} chainId={chainId} address={tokenUSDT.address} />
            }
            {
              chainId && token == "SAFE" &&
              <TokenLogo width="40px" height="40px" />
            }
          </Col>
          <Col span={21}>
            <Text strong>当前账户</Text>
            <br />
            <Text strong>{targetAddress}</Text>
          </Col>
        </Row>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{"跨链到"}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Row>
          <Col span={3} style={{ paddingTop: "5px" }}>
            <Avatar src={getNetworkLogo(targetNetwork)} style={{ width: "40px", height: "40px" }} />
          </Col>
          <Col span={21}>
            <Text strong>{targetNetwork}</Text>
            <br />
            <Text strong>{targetAddress}</Text>
          </Col>
        </Row>
      </Col>
    </Row>
    {
      token == "USDT" && allowance && allowance.needApprove && <>
        <Divider />
        <Row>
          {callAllowance && callAllowance.toExact()}
          <Col span={24}>
            <Alert type="info" message={<Row>
              <Col span={24}>
                <Text>需要先授权跨链合约访问您的USDT资产</Text>
                <Link disabled={approve.executing} onClick={doApproveMAX} style={{ float: "right" }}>
                  {
                    !approve.executing && "点击授权"
                  }
                  {
                    approve.executing && <>
                      <LoadingOutlined /> 正在授权...
                    </>
                  }
                </Link>
              </Col>
            </Row>} />
          </Col>
        </Row>
      </>
    }
    <Divider />
    <Row>
      <Col span={24}>
        <Button onClick={doCrosschain} disabled={token == "USDT" && allowance && allowance.needApprove} style={{ float: "right" }} type="primary">广播交易</Button>
      </Col>
    </Row>
  </Modal>
}
