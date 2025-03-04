import { SyncOutlined } from "@ant-design/icons";
import { TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Avatar, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getNetworkLogo, NetworkType } from "../../../../assets/logo/NetworkLogo";
import { Safe4_Network_Config } from "../../../../config";
import { useIERC20Contract } from "../../../../hooks/useContracts";
import { useBlockNumber } from "../../../../state/application/hooks";
import { useSingleContractMultipleData } from "../../../../state/multicall/hooks";
import { useTokenAllowance, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import ERC20TokenLogoComponent from "../../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../../components/TokenLogo";

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
  const USDT_Contract = useIERC20Contract( tokenUSDT.address , true );
  const allowance = useTokenAllowance( tokenUSDT , activeAccount , "0xf8b99643fafc79d9404de68e48c4d49a3936f787"  );
  return <Modal footer={null} destroyOnClose title={t("wallet_crosschain")} open={openCrosschainConfirmModal} onCancel={cancel}>
    <Divider />
    <Row >
      <Col span={24}>
        { allowance?.toExact() }
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
    <Divider />
    <Row>
      <Col span={24}>
        <Alert type="info" message={<Row>
          <Col span={24}>
            <Text>需要先授权跨链合约访问您的USDT资产</Text>
            <Link style={{ float: "right" }}>点击授权</Link>
          </Col>
        </Row>} />
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        <Button style={{ float: "right" }} type="primary">广播交易</Button>
      </Col>
    </Row>
  </Modal>
}
