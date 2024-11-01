import { Alert, Button, Card, Col, Row, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography

export default () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_supernodes_create")}
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%", height: "800px" }}>
        <Row style={{ marginTop: "120px", marginBottom: "20px" }}>
          <Col span={12} offset={6}>
            <Button onClick={() => navigate("/main/supernodes/registerAssist")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>{t("wallet_supernodes_mode_auto")}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px", whiteSpace: "normal" }}>{t("wallet_supernodes_mode_auto_tip")}</Text>
                </Col>
              </Row>
            </Button>
          </Col>
          <Col span={12} offset={6} style={{ marginTop: "100px" }} >
            <Button onClick={() => navigate("/main/supernodes/register")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>{t("wallet_supernodes_mode_manual")}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px", whiteSpace: "normal" }}>{t("wallet_supernodes_mode_manual_tip")}</Text>
                </Col>
              </Row>
            </Button>
          </Col>
        </Row>
      </Card>
    </Row>

  </>

}

