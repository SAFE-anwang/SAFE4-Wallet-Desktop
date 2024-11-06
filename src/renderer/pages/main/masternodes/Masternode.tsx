import { MasternodeInfo } from "../../../structs/Masternode"
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Card, Divider, TabsProps, Tabs } from 'antd';
import Members from '../../components/Members';
import { RenderNodeState } from "../supernodes/Supernodes";
import AddressComponent from "../../components/AddressComponent";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  masternodeInfo
}: {
  masternodeInfo: MasternodeInfo
}) => {

  const { t } = useTranslation();
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: <>
        {t("wallet_supernodes_incentiveplan_creator")} <Divider type='vertical' /> {t("wallet_supernodes_incentiveplan_members")}
      </>,
      children: <Members memberInfos={masternodeInfo.founders} />,
    },
  ];

  return <>
    <Card title={t("wallet_masternodes_detail")} style={{ width: "100%" }}>
      <Row>
        <Col span={16}>
          <Row>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_masternodes_id")}</Text>
            </Col>
            <Col span={18}>
              <Text strong>{masternodeInfo.id}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_masternodes_state")}</Text>
            </Col>
            <Col span={18}>
              <Text strong>{RenderNodeState(masternodeInfo.state, t)}</Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_masternodes_address")}</Text>
            </Col>
            <Col span={16}>
              <Text strong>
                <AddressComponent address={masternodeInfo.addr} />
              </Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={6}>
              <Text type='secondary'>{t("wallet_masternodes_creator")}</Text>
            </Col>
            <Col span={16}>
              <Text strong>
                <AddressComponent address={masternodeInfo.creator} />
              </Text>
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Text type='secondary'>{t("wallet_supernodes_incentiveplan")}</Text><br /><br />
          <Row>
            <Col span={10}>
              <Text strong>{t("wallet_supernodes_incentiveplan_creator")} {masternodeInfo.incentivePlan.creator}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={masternodeInfo.incentivePlan.creator} showInfo={false} />
            </Col>
          </Row>
          <Row>
            <Col span={10}>
              <Text strong>{t("wallet_supernodes_incentiveplan_members")} {masternodeInfo.incentivePlan.partner}%</Text>
            </Col>
            <Col span={14}>
              <Progress percent={masternodeInfo.incentivePlan.partner} showInfo={false} />
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
              masternodeInfo.founders.reduce<CurrencyAmount>(
                (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
                CurrencyAmount.ether(JSBI.BigInt("0"))
              ).toFixed(6)
            } SAFE
          </Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>{t("wallet_masternodes_enode")}</Text>
        </Col>
        <Col span={20}>
          <Text strong>{masternodeInfo.enode}</Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "5px" }}>
        <Col span={4}>
          <Text type='secondary'>{t("wallet_masternodes_description")}</Text>
        </Col>
        <Col span={20}>
          <Text strong>{masternodeInfo.description}</Text>
        </Col>
      </Row>
      <Divider />
      <Tabs defaultActiveKey="1" items={items} />
    </Card>
  </>

}
