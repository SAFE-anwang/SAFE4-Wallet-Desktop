import { Alert, Card, Col, Divider, Row, Tabs, TabsProps, Typography } from "antd"
import { useTranslation } from "react-i18next";
import Issue from "./Issue";
import AssetList from "./AssetList";


const { Text, Title, Link } = Typography;

export default () => {

  const { t } = useTranslation();

  const tabItems: TabsProps['items'] = [
    {
      key: 'issue',
      label: "发行资产",
      children: <Issue />,
    },
    {
      key: 'list',
      label: "资产管理",
      children: <AssetList />,
    }
  ];

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_issue")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Row>
              <Col span={24}>
                {t("wallet_issue_tip0")}
                <Link style={{ marginLeft: "20px" }} onClick={() => window.open("https://github.com/SAFE-anwang/src20")}>查看代码库</Link>
              </Col>
              <Col span={24}>
                您可以在资产管理中设置资产的相关信息，以及推广您的资产.
              </Col>
            </Row>
          </>} />
        </Card>
        <Divider />
        <Card>
          <Tabs activeKey="list" style={{ width: "100%" }} items={tabItems} />
        </Card>
      </div>
    </div>

  </>

}
