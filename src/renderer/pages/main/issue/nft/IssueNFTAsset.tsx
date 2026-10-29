import { Alert, Card, Col, Divider, Row, Tabs, TabsProps, Typography } from "antd"
import { useTranslation } from "react-i18next";
import NFTAssetList from "./NFTAssetList";
import IssueNFT from "./IssueNFT";
// import Issue from "./Issue";
// import AssetList from "./AssetList";


const { Text, Title, Link } = Typography;

export default () => {

  const { t } = useTranslation();

  const tabItems: TabsProps['items'] = [
    {
      key: 'issue',
      label: t("wallet_issue"),
      children: <IssueNFT />,
    },
    {
      key: 'list',
      label: t("wallet_issue_asset_manage"),
      children: <NFTAssetList />,
    }
  ];

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          发行 NFT 资产
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Row>
              <Col span={24}>
                通过已审计的代码模板,发行 SRC-721 标准的 NFT 资产
                <Link style={{ marginLeft: "20px" }} onClick={() => window.open("https://github.com/SAFE-anwang/src20")}>{t("wallet_issue_view_template_code")}</Link>
              </Col>
              <Col span={24}>
                {t("wallet_issue_tip1")}
              </Col>
            </Row>
          </>} />
        </Card>
        <Divider />
        <Card>
          <Tabs style={{ width: "100%" }} items={tabItems} defaultActiveKey="issue" />
        </Card>
      </div>
    </div>

  </>

}
