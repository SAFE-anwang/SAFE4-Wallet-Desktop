import { Button, Card, Col, Divider, Row, Typography } from "antd";

import { useNavigate } from "react-router-dom";
import { ApiOutlined, DatabaseOutlined, RightOutlined } from "@ant-design/icons";

const { Text, Title } = Typography

export default () => {
  const navigate = useNavigate();
  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 资产迁移
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%", height: "800px" }}>
        <Row style={{ marginTop: "120px", marginBottom: "20px" }}>
          <Col span={12} offset={6}>
            <Button onClick={() => navigate("/main/safe3")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>单地址迁移</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px" }}>提供地址私钥,将 Safe3 网络的资产迁移到 Safe4 网络</Text>
                </Col>
              </Row>
            </Button>
          </Col>
          <Col span={12} offset={6} style={{ marginTop: "100px" }} >
            <Button onClick={() => navigate("/main/safe3BatchRedeem")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>批量迁移</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px" }}>将 Safe3 桌面钱包的资产迁移到 Safe4 网络</Text>
                </Col>
              </Row>
            </Button>
          </Col>
        </Row>
      </Card>
    </Row>

  </>

}

