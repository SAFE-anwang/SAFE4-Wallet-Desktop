import { JsonRpcProvider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core"
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useEffect, useState } from "react";
import { isSafe4Mainnet, isSafe4Network, isSafe4Testnet } from "../../../../utils/Safe4Network";
import { useDispatch } from "react-redux";
import { applicationUpdateWeb3Rpc } from "../../../../state/application/action";

const { Text } = Typography;

export default ({
  endpoint
}: {
  endpoint: string
}) => {
  const { provider } = useWeb3React();
  const dispatch = useDispatch();
  const activeEndpoint = provider?.connection.url;
  const [chainId, setChainId] = useState<number | undefined>();
  const [name, setName] = useState<string>();
  const [activeStatus, setActiveStatus] = useState<{
    isActive: boolean,
    isActiving: boolean
  } | undefined>();

  const switchWeb3ReactConnect = () => {
    if (chainId) {
      dispatch(applicationUpdateWeb3Rpc({
        chainId: chainId,
        endpoint: endpoint
      }));
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
        <Text style={{ marginLeft: "5px" }}>正在连接</Text>
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
      <Text style={{ marginLeft: "5px" }}>网络异常</Text>
    </>
  }

  const renderNetwork = () => {
    if (chainId) {
      if (isSafe4Network(chainId)) {
        if (isSafe4Testnet(chainId)) {
          return <Text type="success">测试网</Text>
        }
        if (isSafe4Mainnet(chainId)) {
          return <Text>主网</Text>
        }
      } else {
        return <Text type="secondary">[{name}]</Text>
      }
    }
  }

  const cantUseable = () => {
    if (chainId   && isSafe4Network( chainId ) ) {
      return endpoint == activeEndpoint;
    }
    return true;
  }

  return <>
    <Card size='small' style={{ marginBottom: "10px" , background: endpoint == activeEndpoint ? "#efefef" : "" }}>
      <Row>
        <Col span={6}>
          {renderActiveStatus()}
        </Col>
        <Col span={12}>
          <Text strong = { endpoint == activeEndpoint }>
            {endpoint}
          </Text>
        </Col>
        <Col span={6} style={{ textAlign: "center" }}>
          <Space>
            <Button disabled={cantUseable()} size='small' onClick={switchWeb3ReactConnect}>
              使用
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  </>

}
