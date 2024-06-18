
import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Alert, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords } from '../../../../state/wallets/hooks';
import { EmptyContract } from '../../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../../state';
import { useSupernodeStorageContract } from '../../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../../structs/Supernode';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Supernode from '../Supernode';
import { fetchSuperNodeAddresses } from '../../../../services/supernode';
import type { TabsProps } from 'antd';
import AccountRecordsVote from './AccountRecordsVote';
import InputAmountVote from './InputAmountVote';
import useSafeScan from '../../../../hooks/useSafeScan';

const { Text, Title } = Typography;

export default () => {

  const supernodeAddr = useSelector<AppState, string | undefined>(state => state.application.control.vote);
  const [supernodeAddresses, setSupernodeAddresses] = useState<string[]>([]);
  const supernodeStorageContract = useSupernodeStorageContract();
  const navigate = useNavigate();
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  const { URL, API } = useSafeScan();
  const items: TabsProps['items'] = [
    {
      key: 'inputAmount',
      label: 'SAFE投票',
      children: <InputAmountVote supernodeInfo={supernodeInfo} supernodeAddresses={supernodeAddresses} />,
    },
    {
      key: 'accountRecords',
      label: '锁仓记录投票',
      children: <AccountRecordsVote supernodeInfo={supernodeInfo} supernodeAddresses={supernodeAddresses} />
    }
  ];

  useEffect(() => {
    if (supernodeAddr && supernodeStorageContract) {
      // function getInfo(address _addr) external view returns (SuperNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(supernodeAddr)
        .then(_supernodeInfo => setSupernodeInfo(formatSupernodeInfo(_supernodeInfo)))
        .catch(err => {

        })
    }
  }, [supernodeAddr]);
  useEffect(() => {
    fetchSuperNodeAddresses(API)
      .then(setSupernodeAddresses)
  }, []);


  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          超级节点投票
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row >
          <Tabs style={{ width: "100%" }} defaultActiveKey="inputAmount" items={items} />
        </Row>
        <Row>
          {
            supernodeInfo && <Supernode supernodeInfo={supernodeInfo} />
          }
        </Row>
      </div>
    </div>

  </>

}
