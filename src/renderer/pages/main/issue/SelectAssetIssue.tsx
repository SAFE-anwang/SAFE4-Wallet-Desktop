import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography

export default () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          发行资产
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%", height: "800px" }}>
        <Row style={{ marginTop: "120px", marginBottom: "20px" }}>
          <Col span={12} offset={6}>
            <Button onClick={() => navigate("/main/issue/src20")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>
                    SRC20 资产
                  </Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px", whiteSpace: "normal" }}>
                    同质化代币(Fungible Token),区块链上的可替代数字资产（如 USDT、UNI 或项目代币）。
                  </Text>
                </Col>
              </Row>
            </Button>
          </Col>
          <Col span={12} offset={6} style={{ marginTop: "100px" }} >
            <Button onClick={() => navigate("/main/issue/nft")} style={{ height: "200px", width: "100%" }}>
              <Row>
                <Col span={24}>
                  <Text style={{ fontSize: "40px" }}>
                    NFT 资产
                  </Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: "20px", whiteSpace: "normal" }}>
                    非同质化代币(Non-Fungible Token),基于 ERC-721 或 ERC-1155 等标准的独一无二的数字资产（如数字艺术品、链上域名或游戏道具）。
                  </Text>
                </Col>
              </Row>
            </Button>
          </Col>
        </Row>
      </Card>
    </Row>

  </>

}

