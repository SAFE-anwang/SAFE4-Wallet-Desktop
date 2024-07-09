
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import Table, { ColumnsType } from 'antd/es/table';
import AddressView from '../../components/AddressView';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { applicationControlAppendMasternode } from '../../../state/application/action';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { SupernodeInfo, formatSupernodeInfo } from '../../../structs/Supernode';
import { RenderNodeState } from '../supernodes/Supernodes';
import AddressComponent from '../../components/AddressComponent';
import { Safe4_Business_Config } from '../../../config';
import MasternodeList from './MasternodeList';

const { Title, Text } = Typography;
const Masternodes_Page_Size = 10;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const [currentMasternodeInfo, setCurrentMasternodeInfo] = useState<MasternodeInfo>();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();

  useEffect(() => {
    if (masternodeStorageContract && activeAccount) {
      setCurrentMasternodeInfo(undefined);
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      masternodeStorageContract.callStatic.getInfo(activeAccount)
        .then((_masternode: any) => setCurrentMasternodeInfo(formatMasternode(_masternode)))
    }
  }, [masternodeStorageContract, activeAccount])

  useEffect(() => {
    if (supernodeStorageContract && activeAccount) {
      setCurrentSupernodeInfo(undefined);
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(activeAccount)
        .then((_masternode: any) => setCurrentSupernodeInfo(formatSupernodeInfo(_masternode)))
    }
  }, [supernodeStorageContract, activeAccount]);

  const items: TabsProps['items'] = [
    {
      key: 'list',
      label: '主节点列表',
      children: <MasternodeList queryMyMasternodes={false} />,
    },
    {
      key: 'myMasternodes',
      label: '我的主节点',
      children: <MasternodeList queryMyMasternodes={true} />,
    },
  ];

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
            注册成为主节点，则不能再注册成为超级节点
          </>} />
          <Divider />
          {
            currentMasternodeInfo && currentMasternodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是主节点
              </>} />
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
            currentMasternodeInfo && currentMasternodeInfo.id == 0 &&
            currentSupernodeInfo && currentSupernodeInfo.id == 0 && <>
              <Button onClick={() => { navigate("/main/masternodes/register") }}>创建主节点</Button>
            </>
          }
        </Card>

        <Card>
          <Tabs items={items}></Tabs>
        </Card>

      </div>
    </div>
  </>
}
