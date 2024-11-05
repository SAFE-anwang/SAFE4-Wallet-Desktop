
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Card, Divider, TabsProps, Tabs } from 'antd';
import { SupernodeInfo } from '../../../structs/Supernode';
import AddressView from '../../components/AddressView';
import Members from '../../components/Members';
import { RenderNodeState } from './Supernodes';
import { useMulticallContract, useSupernodeVoteContract } from '../../../hooks/useContracts';
import { useEffect, useMemo, useState } from 'react';
import SupernodeVoters from './SupernodeVoters';
import AddressComponent from '../../components/AddressComponent';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export default ({
  supernodeInfo
}: {
  supernodeInfo: SupernodeInfo
}) => {

  const { t } = useTranslation();
  const supernodeVoteContract = useSupernodeVoteContract();
  const [totalVoteNum, setTotalVoteNum] = useState<CurrencyAmount>();
  const [totalVoteAmount, setTotalVoteAmount] = useState<CurrencyAmount>();

  useEffect(() => {
    if (supernodeVoteContract) {
      // function getTotalVoteNum(address _addr) external view returns (uint);
      // function getTotalAmount(address _addr) external view returns (uint);
      supernodeVoteContract.callStatic.getTotalVoteNum(supernodeInfo.addr)
        .then(data => { setTotalVoteNum(CurrencyAmount.ether(data)) })
      supernodeVoteContract.callStatic.getTotalAmount(supernodeInfo.addr)
        .then(data => { setTotalVoteAmount(CurrencyAmount.ether(data)) })
    }
  }, [supernodeVoteContract, supernodeInfo]);

  const items: TabsProps['items'] = useMemo(() => {
    return [{
      key: '1',
      label: <>
        {t("wallet_supernodes_incentiveplan_creator")} <Divider type='vertical' /> {t("wallet_supernodes_incentiveplan_members")}
      </>,
      children: <Members memberInfos={supernodeInfo.founders} />,
    },
    {
      key: '2',
      label: <>
        {t("wallet_supernodes_incentiveplan_voters")}
      </>,
      children: <SupernodeVoters supernodeAddr={supernodeInfo.addr} />,
    }];
  }, [supernodeInfo.addr])

  return <>
    <Card title={t("wallet_supernodes_detail")} style={{ width: "100%", marginTop: "50px" }}>
      <Row>
        <Col span={16}>
          <Row>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_supernodes_id")}</Text>
            </Col>
            <Col span={18}>
              <Text strong>{supernodeInfo.id}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_supernodes_state")}</Text>
            </Col>
            <Col span={18}>
              <Text strong>{RenderNodeState(supernodeInfo.state)}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_supernodes_address")}</Text>
            </Col>
            <Col span={16}>
              <Text strong>
                <AddressComponent address={supernodeInfo.addr} />
              </Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_supernodes_name")}</Text>
            </Col>
            <Col span={18}>
              <Text strong>{supernodeInfo.name}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_supernodes_creator")}</Text>
            </Col>
            <Col span={16}>
              <Text strong>
                <AddressComponent address={supernodeInfo.creator} />
              </Text>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Text type='secondary'>{t("wallet_supernodes_incentiveplan")}</Text><br /><br />
          <Row>
            <Col span={10}>
              <Text strong>{t("wallet_supernodes_incentiveplan_creator")} {supernodeInfo.incentivePlan.creator}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.creator} showInfo={false} />
            </Col>
          </Row>
          <Row>
            <Col span={10}>
              <Text strong>{t("wallet_supernodes_incentiveplan_members")} {supernodeInfo.incentivePlan.partner}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.partner} showInfo={false} />
            </Col>
          </Row>
          <Row>
            <Col span={10}>
              <Text strong>{t("wallet_supernodes_incentiveplan_voters")} {supernodeInfo.incentivePlan.voter}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={supernodeInfo.incentivePlan.voter} showInfo={false} />
            </Col>
          </Row>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>{t("wallet_supernodes_createstake")}</Text>
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
          <Text type='secondary'>{t("wallet_supernodes_votestake")}</Text>
        </Col>
        <Col span={20}>
          <Text strong>
            {totalVoteAmount?.toFixed(6)} SAFE
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>{t("wallet_supernodes_enode")}</Text>
        </Col>
        <Col span={20}>
          <Text strong>{supernodeInfo.enode}</Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>{t("wallet_supernodes_description")}</Text>
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
