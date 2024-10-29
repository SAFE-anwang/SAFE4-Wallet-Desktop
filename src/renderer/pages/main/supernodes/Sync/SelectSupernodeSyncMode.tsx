import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography

export default () => {
  const navigate = useNavigate();
  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          同步超级节点数据
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%", height: "800px" }}>
        <Row style={{ marginTop: "120px", marginBottom: "20px" }}>
          <Col span={12} offset={6}>
            <Button onClick={() => navigate("/main/supernodes/syncAssist")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>自动模式</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px" }}>已有云服务器,钱包通过SSH登陆辅助同步超级节点信息</Text>
                </Col>
              </Row>
            </Button>
          </Col>
          <Col span={12} offset={6} style={{ marginTop: "100px" }} >
            <Button onClick={() => navigate("/main/supernodes/sync")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>手动模式</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px" }}>已在服务器配置超级节点,直接更新同步超级节点信息</Text>
                </Col>
              </Row>
            </Button>
          </Col>
        </Row>
      </Card>
    </Row>

  </>

}

