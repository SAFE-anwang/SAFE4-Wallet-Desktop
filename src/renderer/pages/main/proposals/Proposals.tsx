import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps } from "antd";
import { t } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useBlockNumber } from "../../../state/application/hooks";
import ProposalList from "./ProposalList";

const { Text, Title } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const blockNumber = useBlockNumber();
  const openCreateProposal = useMemo( () => {
    return blockNumber >= 86400;
  } , [ blockNumber ] )

  const items: TabsProps['items'] = [
    {
      key: 'list',
      label: t("wallet_proposals_list"),
      children: <ProposalList />,
    },
    {
      key: 'myproposals',
      label: t("wallet_proposals_mine"),
      children: <ProposalList queryMyProposals={true} />,
    },
  ];

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("proposal")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Text>{t("wallet_proposals_create_tip0")} <Text strong>1 SAFE</Text> {t("wallet_proposals_create_tip1")}</Text><br />
            <Text>{t("wallet_proposals_create_tip2")}</Text>
          </>} />
          <Divider />
          <Button disabled={!openCreateProposal} onClick={() => {
            navigate("/main/proposals/create")
          }}>{t("wallet_proposals_create")}</Button>
        </Card>
        <Card>
          <Tabs items={items}></Tabs>
        </Card>
      </div>
    </div>

  </>)

}
