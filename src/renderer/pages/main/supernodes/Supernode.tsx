
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Card, Divider, TabsProps, Tabs } from 'antd';
import { SupernodeInfo } from '../../../structs/Supernode';
import AddressView from '../../components/AddressView';
import Members from '../../components/Members';
import { RenderNodeState } from './Supernodes';
import { useMulticallContract, useSupernodeVoteContract } from '../../../hooks/useContracts';
import { useEffect, useState } from 'react';
import SupernodeVoters from './SupernodeVoters';

const { Text } = Typography;

export default ({
  supernodeInfo
}: {
  supernodeInfo: SupernodeInfo
}) => {

  const supernodeVoteContract = useSupernodeVoteContract();
  const [totalVoteNum , setTotalVoteNum] = useState<CurrencyAmount>();
  const [totalVoteAmount, setTotalVoteAmount] = useState<CurrencyAmount>();

  useEffect( () => {
    if ( supernodeVoteContract){
      // function getTotalVoteNum(address _addr) external view returns (uint);
      // function getTotalAmount(address _addr) external view returns (uint);
      supernodeVoteContract.callStatic.getTotalVoteNum( supernodeInfo.addr )
        .then( data => { setTotalVoteNum( CurrencyAmount.ether(data) ) } )
      supernodeVoteContract.callStatic.getTotalAmount( supernodeInfo.addr )
        .then( data => { setTotalVoteAmount(CurrencyAmount.ether(data)) } )
    }
  } , [supernodeVoteContract] );

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: <>
        创建人 <Divider type='vertical' /> 合伙人
      </>,
      children: <Members memberInfos={supernodeInfo.founders} />,
    },
    {
      key: '2',
      label: <>
        投票人
      </>,
      children: <SupernodeVoters supernodeAddr={supernodeInfo.addr} />,
    },
  ];

  return <>
    <Card title="超级节点详情" style={{ width: "100%", marginTop: "50px" }}>
      <Row>
        <Col span={16}>
          <Row>
            <Col span={6}>
              <Text type='secondary'>节点ID:</Text>
            </Col>
            <Col span={18}>
              <Text strong>{supernodeInfo.id}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>节点状态:</Text>
            </Col>
            <Col span={18}>
              <Text strong>{RenderNodeState(supernodeInfo.state)}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>节点地址:</Text>
            </Col>
            <Col span={18}>
              <Text strong><AddressView address={supernodeInfo.addr} /></Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>节点名称:</Text>
            </Col>
            <Col span={18}>
              <Text strong>{supernodeInfo.name}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>创建者:</Text>
            </Col>
            <Col span={18}>
              <Text strong><AddressView address={supernodeInfo.creator} /></Text>

            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Text type='secondary'>挖矿奖励分配:</Text><br /><br />
          <Row>
            <Col span={10}>
              <Text strong>创建者 {supernodeInfo.incentivePlan.creator}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.creator} showInfo={false} />
            </Col>
          </Row>
          <Row>
            <Col span={10}>
              <Text strong>合伙人 {supernodeInfo.incentivePlan.partner}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.partner} showInfo={false} />
            </Col>
          </Row>
          <Row>
            <Col span={10}>
              <Text strong>投票人 {supernodeInfo.incentivePlan.voter}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.voter} showInfo={false} />
            </Col>
          </Row>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>创建质押:</Text>
        </Col>
        <Col span={20}>
          <Text strong>
            {
              supernodeInfo.founders.reduce<CurrencyAmount>(
                (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
                CurrencyAmount.ether(JSBI.BigInt("0"))
              ).toFixed(6)
            } SAFE
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>投票质押:</Text>
        </Col>
        <Col span={20}>
          <Text strong>
            {totalVoteAmount?.toFixed(6)} SAFE
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>节点ENODE:</Text>
        </Col>
        <Col span={20}>
          <Text strong>{supernodeInfo.enode}</Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>节点描述:</Text>
        </Col>
        <Col span={20}>
          <Text strong>{supernodeInfo.description}</Text>
        </Col>
      </Row>
      <Divider />
      <Tabs defaultActiveKey="1" items={items} />
    </Card>
  </>

}
