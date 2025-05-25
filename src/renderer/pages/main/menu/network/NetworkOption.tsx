import { JsonRpcProvider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core"
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useEffect, useState } from "react";
import { isSafe4Mainnet, isSafe4Network, isSafe4Testnet } from "../../../../utils/Safe4Network";
import { useDispatch } from "react-redux";
import { applicationBlockchainUpdateBlockNumber, applicationRemoveRpcConfig, applicationUpdateWeb3Rpc } from "../../../../state/application/action";
import { clearAllTransactions } from "../../../../state/transactions/actions";
import { walletsClearWalletChildWallets } from "../../../../state/wallets/action";
import { useTranslation } from "react-i18next";
import { IPC_CHANNEL, Safe4_Network_Config } from "../../../../config";
import { RpcConfig_Methods, RpcConfigSignal } from "../../../../../main/handlers/RpcConfigSignalHandler";

const { Text } = Typography;

export default ({
  endpoint
}: {
  endpoint: string
}) => {
  const { provider } = useWeb3React();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeEndpoint = provider?.connection.url;
  const [chainId, setChainId] = useState<number | undefined>();
  const [name, setName] = useState<string>();
  const [activeStatus, setActiveStatus] = useState<{
    isActive: boolean,
    isActiving: boolean
  } | undefined>();
  const currentChainId = useWeb3React().chainId;

  const switchWeb3ReactConnect = () => {
    if (chainId) {
      dispatch(applicationBlockchainUpdateBlockNumber({ blockNumber: 0, timestamp: 0 }))
      if (chainId != currentChainId) {
        dispatch(clearAllTransactions(""));
      }
      dispatch(applicationUpdateWeb3Rpc({
        chainId: chainId,
        endpoint: endpoint
      }));
      dispatch(walletsClearWalletChildWallets());
    }
  }

  useEffect(() => {
    const provider = new JsonRpcProvider(endpoint);
    setActiveStatus({
      isActive: false,
      isActiving: true
    })
    provider.getNetwork().then((data) => {
      const { chainId, name } = data;
      setChainId(chainId);
      setName(name);
      setActiveStatus({
        isActive: true,
        isActiving: false
      })
    }).catch((err: any) => {
      setActiveStatus({
        isActive: false,
        isActiving: false
      })
    })
  }, []);

  const renderActiveStatus = () => {
    if (!activeStatus || activeStatus.isActiving) {
      return <>
        <Badge status="warning"></Badge>
        <Text style={{ marginLeft: "5px" }}>{t("wallet_network_state_connecting")}</Text>
      </>
    }
    if (activeStatus.isActive) {
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
        return <Text type="secondary">[{name}]</Text>
      }
    }
  }

  const cantUseable = () => {
    if (chainId && isSafe4Network(chainId)) {
      return endpoint == activeEndpoint;
    }
    return true;
  }
  const isDefaultEndpoint = (endpoint == Safe4_Network_Config.Mainnet.endpoint || endpoint == Safe4_Network_Config.Testnet.endpoint);
  const isActiveEndpoint = endpoint == activeEndpoint;

  const deleteEndpoint = () => {
    dispatch(applicationRemoveRpcConfig({ endpoint }));
    const method = RpcConfig_Methods.delete;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [RpcConfigSignal, method, [endpoint]] );
  }

  return <>
    <Card key={endpoint} size='small' style={{ marginBottom: "10px", background: endpoint == activeEndpoint ? "#efefef" : "" }}>
      <Row>
        <Col span={6}>
          {renderActiveStatus()}
        </Col>
        <Col span={12}>
          <Text strong={endpoint == activeEndpoint}>
            {endpoint}
          </Text>
        </Col>
        <Col span={6} style={{ textAlign: "center" }}>
          <Space>
            <Button disabled={cantUseable()} size='small' onClick={switchWeb3ReactConnect}>
              {t("use")}
            </Button>
            {
              !isDefaultEndpoint && !isActiveEndpoint && <Button size="small" onClick={deleteEndpoint}>
                删除
              </Button>
            }
          </Space>
        </Col>
      </Row>
    </Card>
  </>

}
