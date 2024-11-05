
import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Alert, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

export default () => {

  const { t } = useTranslation();
  const supernodeAddr = useSelector<AppState, string | undefined>(state => state.application.control.vote);
  const [supernodeAddresses, setSupernodeAddresses] = useState<string[]>([]);
  const supernodeStorageContract = useSupernodeStorageContract();
  const navigate = useNavigate();
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  const { URL, API } = useSafeScan();
  const items: TabsProps['items'] = [
    {
      key: 'inputAmount',
      label: t("wallet_supernodes_votes_safe"),
      children: <InputAmountVote supernodeInfo={supernodeInfo} supernodeAddresses={supernodeAddresses} />,
    },
    {
      key: 'accountRecords',
      label: t("wallet_supernodes_votes_locked"),
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
          {t("wallet_supernodes_votes")}
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
