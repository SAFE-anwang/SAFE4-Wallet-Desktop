import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  LeftOutlined
} from '@ant-design/icons';
import { useWeb3React } from '@web3-react/core';
import NetworkOption from './NetworkOption';
import { isSafe4Mainnet, isSafe4Network, isSafe4Testnet } from '../../../../utils/Safe4Network';
import { useApplicationRpcConfigs } from '../../../../state/application/hooks';
import { useEffect, useState } from 'react';
import { IPC_CHANNEL, Safe4_Network_Config } from '../../../../config';
import NetworkAddModal from './NetworkAddModal';
import { RpcConfigSignal, RpcConfigSingalHandler, RpcConfig_Methods } from '../../../../../main/handlers/RpcConfigSignalHandler';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { provider, chainId, isActivating, isActive } = useWeb3React();
  const rpcConfigs = useApplicationRpcConfigs();

  const [endpoints, setEndpoints] = useState<{
    [endpoint: string]: number
  }>();
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);

  const renderActiveStatus = () => {
    if (isActivating) {
      return <>
        <Badge status="warning"></Badge>
        <Text style={{ marginLeft: "5px" }}>{t("wallet_network_state_connecting")}</Text>
      </>
    }
    if (isActive) {
      return <>
        <Badge status="processing"></Badge>
        <Text style={{ marginLeft: "5px" }}>{renderNetwork()}</Text>
      </>
    }
    return <>
      <Badge status="error"></Badge>
      <Text style={{ marginLeft: "5px" }}>{t("wallet_network_state_connecterror")}</Text>
    </>
  }

  const renderNetwork = () => {
    if (chainId) {
      if (isSafe4Network(chainId)) {
        if (isSafe4Testnet(chainId)) {
          return <Text type="success">{t("testnet")}</Text>
        }
        if (isSafe4Mainnet(chainId)) {
          return <Text>{t("mainnet")}</Text>
        }
      } else {
        return <Text type="secondary">[{provider?.network.name}]</Text>
      }
    }
  }

  useEffect(() => {
    if (rpcConfigs) {
      const endpoints: { [endpoint: string]: number } = {
        [Safe4_Network_Config.Mainnet.endpoint]: Safe4_Network_Config.Mainnet.chainId,
        [Safe4_Network_Config.Testnet.endpoint]: Safe4_Network_Config.Testnet.chainId
      }
      rpcConfigs.forEach(rpcConfig => {
        const { endpoint, chainId } = rpcConfig;
        if (endpoint) {
          endpoints[endpoint.trim()] = chainId;
        }
      });
      console.log(endpoints)
      setEndpoints(endpoints);
    }
  }, [rpcConfigs]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/menu")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_network")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card title={t("wallet_network_using")} style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <Col span={12}>
              <Text type='secondary'>{t("wallet_network_type")}</Text><br />
              {renderActiveStatus()}
            </Col>
            <Col span={12}>
              <Text type='secondary'>{t("wallet_network_endpoint")}</Text><br />
              <Text>{provider?.connection.url}</Text>
            </Col>
          </Row>
        </Card>
        <Divider />
        <Card title={<>
          <Row>
            <Col span={24} style={{ textAlign: "right" }}>
              <Button onClick={() => setOpenAddModal(true)}>{t("wallet_network_add")}</Button>
            </Col>
          </Row>
        </>}>
          <Alert style={{ marginBottom: "30px" }} showIcon type='info' message={<>
            {t("wallet_network_tip")}
          </>} />
          {
            endpoints && Object.keys(endpoints)
              .map(endpoint => {
                return <NetworkOption endpoint={endpoint} />
              })
          }
          {/* <NetworkOption endpoint='http://172.104.162.94:8545' />
          <NetworkOption endpoint='http://47.107.47.210:8545' />
          <NetworkOption endpoint='https://arb1.arbitrum.io/rpc' />
          <NetworkOption endpoint='https://polygon-rpc.com' /> */}
          <Divider />
        </Card>
      </div>
    </div>

    <NetworkAddModal openAddModal={openAddModal} cancel={() => { setOpenAddModal(false) }} />

  </>
}
