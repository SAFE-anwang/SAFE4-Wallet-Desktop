import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LeftOutlined
} from '@ant-design/icons';
import { useWeb3Hooks } from '../../../../connectors/hooks';
import NetworkCard from '../../../web3reactexample/components/connectorCards/NetworkCard';
import { network } from '../../../../connectors/network';

const { Title, Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();

  useEffect(() => {
    if (provider) {
      console.log(provider)
      provider.getNetwork().then((data) => {
        console.log(data)
      })
    }
  }, [provider]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/menu")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          网络
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card title="正在使用的网络" style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <Col span={12}>
              <Text type='secondary'>网络类型</Text><br />
              <Text>主网</Text>
            </Col>
            <Col span={12}>
              <Text type='secondary'>服务地址(Endpoint)</Text><br />
              <Text>http://172.23.12.142:8545</Text>
            </Col>
          </Row>
          <Row style={{ marginBottom: "20px" }}>
            <Col span={12}>
              <Text type='secondary'>网络名称</Text><br />
              <Text>Safe4</Text>
            </Col>
            <Col span={12}>
              <Text type='secondary'>网络ID</Text><br />
              <Text>666666</Text>
            </Col>
          </Row>
        </Card>
        <Divider />
        <Card>

          <Alert style={{ marginBottom: "30px" }} showIcon type='info' message={<>
            仅支持 Safe4 网络的端点服务,您也可以连接自己的 Safe4 节点.
          </>} />

          <Card size='small' style={{ marginBottom: "10px" }}>
            <Row >
              <Col span={6}>
                主网
              </Col>
              <Col span={12}>
                http://172.23.12.142:8545
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Space>
                  <Button size='small'>
                    使用
                  </Button>
                  <Button size='small'>
                    删除
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card size='small' style={{ marginBottom: "10px" }}>
            <Row >
              <Col span={6}>
                主网
              </Col>
              <Col span={12}>
                http://172.23.12.142:8545
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Space>
                  <Button size='small'>
                    使用
                  </Button>
                  <Button size='small'>
                    删除
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card size='small' style={{ marginBottom: "10px" }}>
            <Row >
              <Col span={6}>
                主网
              </Col>
              <Col span={12}>
                http://172.23.12.142:8545
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Space>
                  <Button size='small' onClick={() => {
                     console.log(network);
                     network.activate(6666666).then( () => {
                      console.log("lllll")
                     }).catch( ( error:any ) => {
                      console.log("error :" , error)
                     });
                  }}>
                    使用
                  </Button>
                  <Button size='small'>
                    删除
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>


          <Divider />
          <NetworkCard />

        </Card>
      </div>
    </div>

  </>
}
