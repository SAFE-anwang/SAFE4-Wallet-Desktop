
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import MasternodeList from './MasternodeList';
import useAddrNodeInfo from '../../../hooks/useAddrIsNode';
const { Title, Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountNodeInfo = useAddrNodeInfo( activeAccount );
  const [activeItemKey, setActiveItemKey] = useState("list");

  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'list',
        label: '主节点列表',
        children: <MasternodeList queryMyMasternodes={false} queryJoinMasternodes={false} />,
      },
      {
        key: 'myMasternodes',
        label: '我的主节点',
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <MasternodeList queryMyMasternodes={true} queryJoinMasternodes={false} />,
      },
      {
        key: 'myJoinMasternodes',
        label: '我加入的主节点',
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <MasternodeList queryMyMasternodes={false} queryJoinMasternodes={true} />,
      },
    ]
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect( () => {
    if ( activeAccountNodeInfo && activeAccountNodeInfo.isNode ){
      setActiveItemKey("list");
    }
  } , [ activeAccount , activeAccountNodeInfo ] )

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          主节点
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Row>
              <Col span={24}>
                <Text>什么是主节点?</Text>
              </Col>
              <Col span={24}>
                <Text>创建主节点有什么好处?</Text>
              </Col>
              <Col span={24}>
                <Text>这个页面可以干什么?</Text>
              </Col>
            </Row>
          </>} />
          <Divider />
          <>
            <Spin spinning={ activeAccountNodeInfo == undefined }>
              <Button disabled={ activeAccountNodeInfo == undefined || activeAccountNodeInfo?.isNode }
                      style={{ marginBottom: "5px" }} onClick={() => { navigate("/main/masternodes/selectRegisterMode") }}>创建主节点</Button>
              {
                activeAccountNodeInfo?.isMN && <>
                  <Alert showIcon type='warning' message={<>
                    已经是主节点
                  </>} />
                </>
              }
              {
                activeAccountNodeInfo?.isSN && <>
                  <Alert showIcon type='warning' message={<>
                    已经是超级节点
                  </>}/>
                </>
              }
            </Spin>
          </>
        </Card>
        <Card>
          <Tabs activeKey={activeItemKey} items={items} onChange={setActiveItemKey}></Tabs>
        </Card>
      </div>
    </div>
  </>
}
