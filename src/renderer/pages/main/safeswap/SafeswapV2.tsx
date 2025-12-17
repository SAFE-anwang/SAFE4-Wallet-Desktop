import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Flex, Input, InputNumber, MenuProps, message, Popover, Row, Select, Space, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import Swap from "./Swap";
import AssetPool, { AssetPoolModule } from "./AssetPool";
import { SettingFilled, SettingOutlined } from "@ant-design/icons";
import SlippageSetting from "./SlippageSetting";
import { useSafeswapV2Pairs } from "./hooks";
import { useTranslation } from "react-i18next";
import { useSafeswapAction, useSafeswapTokens } from "../../../state/application/hooks";
import { Stock } from "@ant-design/charts";
import TokensKLine from "./TokensKLine";

const { Title, Text, Link } = Typography;

const enum ActiveModule {
  Swap = "Swap",
  AssetsPool = "AssetsPool"
}

export default () => {

  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.Swap);
  const [_assetPoolModule, set_AssetPoolModule] = useState<AssetPoolModule>();
  const goToAddLiquidity = () => {
    set_AssetPoolModule(AssetPoolModule.Add);
    setActiveModule(ActiveModule.AssetsPool);
  }
  const safeswapV2Pairs = useSafeswapV2Pairs();
  const safeswapAction = useSafeswapAction();

  useEffect(() => {
    if (safeswapAction) {
      if ("AddLiquidity" == safeswapAction) {
        goToAddLiquidity();
      }
    }
  }, [safeswapAction]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_safeswap")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "60px" }}>
      <div style={{ margin: "auto", width: "100%" }}>
        {/* <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                {t("wallet_safeswap_swap_tip0")}
              </>}></Alert>
            </div>
          </Row>
          <Divider /> */}
        <Row>
          <Col span={14}>
            {TokensKLine()}
          </Col>
          <Col span={8} offset={2}>
            <Card style={{ width: "100%", boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)" }}>
              <Row style={{ marginBottom: "20px" }}>
                <Col span={12} style={{ textAlign: "center" }}>
                  <Button onClick={() => setActiveModule(ActiveModule.Swap)}
                    style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.Swap ? "black" : "#b9a4a4" }} type="text">
                    {t("wallet_safeswap_swap")}
                  </Button>
                </Col>
                <Col span={12} style={{ textAlign: "center" }}>
                  <Button onClick={() => setActiveModule(ActiveModule.AssetsPool)}
                    style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.AssetsPool ? "black" : "#b9a4a4" }} type="text">
                    {t("wallet_safeswap_liquiditypool")}
                  </Button>
                  <Popover placement="rightTop" content={<>
                    <div style={{ width: "300px" }}>
                      <SlippageSetting />
                    </div>
                  </>} title={t("wallet_safeswap_settings")} trigger="click">
                    <SettingOutlined style={{ float: "right" }} />
                  </Popover>
                </Col>
              </Row>
              {
                activeModule == ActiveModule.Swap && <Swap safeswapV2Pairs={safeswapV2Pairs} goToAddLiquidity={goToAddLiquidity} />
              }
              {
                activeModule == ActiveModule.AssetsPool && <AssetPool
                  safeswapV2Pairs={safeswapV2Pairs}
                  _assetPoolModule={_assetPoolModule} />
              }
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  </>
}
