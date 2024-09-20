
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal, Tabs, TabsProps, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasternodeStorageContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import SupernodeList from './SupernodeList';
import useAddrNodeInfo from '../../../hooks/useAddrIsNode';

const { Title, Text } = Typography;

export const RenderNodeState = (state: number) => {
  switch (state) {
    case 0:
      return <Badge status="success" text="初始化" />
    case 1:
      return <Badge status="processing" text="在线" />
    case 2:
      return <Badge status="error" text="异常" />
    default:
      return <Badge status="default" text="未知" />
  }
}

export function toFixedNoRound(number: number, decimalPlaces: number) {
  const str = number.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) {
    return str;
  }
  const truncatedStr = str.substring(0, decimalIndex + decimalPlaces + 1);
  return parseFloat(truncatedStr).toFixed(decimalPlaces);
}

export default () => {

  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);
  const [activeItemKey, setActiveItemKey] = useState("list");

  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'list',
        label: '超级节点列表',
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={false} />,
      },
      {
        key: 'mySupernodes',
        label: '我的超级节点',
        children: <SupernodeList queryMySupernodes={true} queryJoinSupernodes={false} />,
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
      },
      {
        key: 'myJoinedSupernodes',
        label: '我加入的超级节点',
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={true} />,
      },
    ]
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect(() => {
    if (activeAccountNodeInfo && activeAccountNodeInfo.isNode) {
      setActiveItemKey("list");
    }
  }, [activeAccount, activeAccountNodeInfo])

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          超级节点
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type='info' message={<>
            <Text>什么是超级节点</Text><br />
            <Text>超级节点能干什么</Text><br />
          </>} />
          <Divider />
          <>
            <Spin spinning={activeAccountNodeInfo == undefined}>
              <Button disabled={activeAccountNodeInfo == undefined || activeAccountNodeInfo?.isNode}
                style={{ marginBottom: "5px" }} onClick={() => { navigate("/main/supernodes/selectRegisterMode") }}>创建超级节点</Button>
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
                  </>} />
                </>
              }
            </Spin>
          </>
        </Card>
        <br /><br />
        <Card>
          <Tabs activeKey={activeItemKey} items={items} onChange={setActiveItemKey}></Tabs>
        </Card>
      </div>
    </div>
  </>
}
