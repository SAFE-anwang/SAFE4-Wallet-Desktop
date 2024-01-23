
import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Space, Input } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords, useETHBalances, useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { EmptyContract } from '../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../structs/Supernode';
import VoteModalConfirm from './Vote/VoteModal-Confirm';
import { AccountRecord } from '../../../structs/AccountManager';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text , Title } = Typography;

export default () => {

  const supernodeAddr = useSelector<AppState, string | undefined>(state => state.application.control.vote);
  const supernodeStorageContract = useSupernodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const navigate = useNavigate();
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();

  useEffect(() => {
    if (supernodeAddr && supernodeStorageContract) {
      // function getInfo(address _addr) external view returns (SuperNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(supernodeAddr)
        .then(_supernodeInfo => setSupernodeInfo(formatSupernodeInfo(_supernodeInfo)))
        .catch(err => {

        })
    }
  }, [supernodeAddr]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          超级节点联合创立
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Card title="通过锁仓SAFE来成为这个超级节点的股东" style={{ width: "100%" }}>
            <>
              <Row>
                <Col span={24}>
                  <Text></Text>
                </Col>
              </Row>
              <Divider />
              <Row >
                <Col span={14}>
                  <Text strong>数量</Text>
                  <br />
                  <Space.Compact style={{ width: '100%' }}>
                    <Input size="large" onChange={(_input:any) => {
                      const toInputValue = _input.target.value;
                    }} placeholder="输入数量" />
                    <Button size="large">最大</Button>
                  </Space.Compact>
                </Col>
                <Col span={10}>
                  <Text style={{ float: "right" }} strong>账户余额</Text>
                  <br />
                  <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
                    {balance?.toFixed(6)} SAFE
                  </Text>
                </Col>
              </Row>
              <Divider />
              <Button type='primary'>
                加入股东
              </Button>
            </>
          </Card>
        </Row>
        <Row>
          <Card title="超级节点详情" style={{ width: "100%", marginTop: "50px" }}>
            {supernodeInfo?.addr}
          </Card>
        </Row>
      </div>
    </div>
  </>

}
