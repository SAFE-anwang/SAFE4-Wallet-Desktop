import { ArrowDownOutlined, DownOutlined, LeftOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrencyAmount, Token, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import { useETHBalances, useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Safe4NetworkChainId, USDT } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import TokenSelectModal from "./TokenSelectModal";

const { Title, Text, Link } = Typography;

const { Option } = Select;

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();

  const [tokenA , setTokenA] = useState<Token | undefined>();
  const [tokenB , setTokenB] = useState<Token | undefined>();



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
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>{t("wallet_crosschain_select_token")}</Text>
              </Col>
              <Col span={16}>
                <Input size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }}
                  onChange={(event) => {

                  }} />
              </Col>
              <Col span={8}>
                <Row style={{ marginTop: "24px" }}>
                  <Col span={8}>
                    <div style={{ marginTop: "4px" }}>
                      <Link>{t("wallet_send_max")}</Link>
                      <Divider type="vertical" />
                    </div>
                  </Col>
                  <Col span={16}>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <ArrowDownOutlined style={{ fontSize: "24px", color: "green", marginTop: "10px", marginBottom: "10px" }} />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>选择代币</Text>
              </Col>
              <Col span={16}>
                <Input size="large" style={{ height: "80px", width: "150%" }} />
              </Col>
              <Col span={8}>
                <Row style={{ marginTop: "24px" }}>
                  <Col span={8}>

                  </Col>
                  <Col span={16}>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col span={24}>
                <Button type="primary" style={{ float: "right" }}>{t("next")}</Button>
              </Col>
            </Row>
          </Card>
        </Card>
      </div>
    </div>

    <TokenSelectModal />

  </>
}
