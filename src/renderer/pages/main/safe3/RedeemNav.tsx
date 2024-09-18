import { Card, Col, Divider, Row, Typography } from "antd";

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
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card className="menu-item-container" style={{ marginBottom: "20px" }}>
          <Row className='menu-item' onClick={() => {
            navigate("/main/safe3")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <ApiOutlined />
            </Col>
            <Col span={20}>
              已有 Safe3 钱包地址私钥,将该地址的资产迁移到 Safe4 网络
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>
          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            navigate("/main/safe3BatchRedeem")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <DatabaseOutlined />
            </Col>
            <Col span={20}>
              将 Safe3 桌面钱包的资产迁移到 Safe4 网络
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  </>

}

