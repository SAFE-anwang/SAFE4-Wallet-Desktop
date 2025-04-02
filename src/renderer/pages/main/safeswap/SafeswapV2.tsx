import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import Swap from "./Swap";
import AssetPool from "./AssetPool";
const { Title, Text, Link } = Typography;


const SafeswapV2_Fee_Rate = "0.003";

const enum SwapFocus {
  BuyIn = "BuyIn",
  SellOut = "SellOut",
}

const enum PriceType {
  A2B = "A2B",
  B2A = "B2A"
}

const enum ActiveModule {
  Swap = "Swap",
  AssetsPool = "AssetsPool"
}

export default () => {

  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.AssetsPool);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          互兑交易
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                使用 Safeswap 在 Safe4 网络中进行代币互兑交易
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          <Card style={{ width: "50%", margin: "auto" }}>

            <Row style={{ marginBottom: "20px" }}>
              <Col span={12} style={{ textAlign: "center" }}>
                <Button onClick={() => setActiveModule(ActiveModule.Swap)}
                  style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.Swap ? "black" : "#b9a4a4" }} type="text">
                  兑换
                </Button>
              </Col>
              <Col span={12} style={{ textAlign: "center" }}>
                <Button onClick={() => setActiveModule(ActiveModule.AssetsPool)}
                  style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.AssetsPool ? "black" : "#b9a4a4" }} type="text">
                  资金池
                </Button>
              </Col>
            </Row>
            {
              activeModule == ActiveModule.Swap && <Swap />
            }
            {
              activeModule == ActiveModule.AssetsPool && <AssetPool />
            }
          </Card>
        </Card>
      </div>
    </div>
  </>
}
