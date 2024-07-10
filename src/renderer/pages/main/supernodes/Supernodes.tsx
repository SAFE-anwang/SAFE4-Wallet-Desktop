
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal, Tabs, TabsProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasternodeStorageContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import SupernodeList from './SupernodeList';

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

export function toFixedNoRound(number : number, decimalPlaces : number) {
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
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();
  const [currentMasternodeInfo, setCurrentMasternodeInfo] = useState<MasternodeInfo>();

  useEffect(() => {
    if (activeAccount && supernodeStorageContract) {
      if (supernodeStorageContract && activeAccount) {
        setCurrentSupernodeInfo(undefined);
        // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
        supernodeStorageContract.callStatic.getInfo(activeAccount)
          .then((_supernode: any) => setCurrentSupernodeInfo(formatSupernodeInfo(_supernode)))
      }
    }
  }, [supernodeStorageContract, activeAccount]);

  useEffect(() => {
    if (activeAccount && masternodeStorageContract) {
      if (masternodeStorageContract && activeAccount) {
        setCurrentMasternodeInfo(undefined);
        // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
        masternodeStorageContract.callStatic.getInfo(activeAccount)
          .then((_masternode: any) => setCurrentMasternodeInfo(formatMasternode(_masternode)))
      }
    }
  }, [masternodeStorageContract, activeAccount]);

  const items: TabsProps['items'] = [
    {
      key: 'list',
      label: '超级节点列表',
      children: <SupernodeList queryMySupernodes={false} />,
    },
    {
      key: 'mySupernodes',
      label: '我的超级节点',
      children: <SupernodeList queryMySupernodes={true} />,
    },
  ];

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
            <Text>注册成为超级节点,将不能再注册主节点</Text><br />
            <Text>注册成为超级节点,将不能再使用该账户下的锁仓记录进行超级节点投票</Text><br />
          </>} />
          <Divider />
          {
            (currentSupernodeInfo && currentSupernodeInfo.id == 0 && currentMasternodeInfo && currentMasternodeInfo.id == 0) && <>
              <Button onClick={() => navigate("/main/supernodes/create")}>创建超级节点</Button>
            </>
          }
          {
            currentSupernodeInfo && currentSupernodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是超级节点
              </>} />
            </>
          }
          {
            currentMasternodeInfo && currentMasternodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是主节点
              </>} />
            </>
          }
        </Card>
        <br /><br />
        <Card>
          <Tabs items={items} ></Tabs>
        </Card>
      </div>
    </div>



  </>
}
