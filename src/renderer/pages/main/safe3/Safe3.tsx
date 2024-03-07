
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useEffect, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";

const { Text, Title } = Typography;

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;
const isSafe3DesktopExportPrivateKey = (input: string) => {
  return base58Regex.test(input);
};

export default () => {

  const [safe3PrivateKey, setSafe3PrivateKey] = useState<string>();
  const [inputErrors, setInputErrors] = useState<{
    safe3PrivateKeyError: string
  }>();

  const [safe3Wallet, setSafe3Wallet] = useState<{
    privateKey: string,
    publicKey: string,
    compressPublicKey: string,
    safe3Address: string,
    safe3CompressAddress: string,
    safe4Address: string
  }>();

  useEffect(() => {
    // const result = Safe3PrivateKey("XJ2M1PbCAifB8W91hcHDEho18kA2ByB4Jdmi4XBHq5sNgtuEpXr4");
    console.log("safe3 private key >> :", safe3PrivateKey);
    if (safe3PrivateKey) {
      if (isSafe3DesktopExportPrivateKey(safe3PrivateKey)) {
        setInputErrors(undefined);
        setSafe3Wallet(
          Safe3PrivateKey(safe3PrivateKey)
        )
      } else {
        setInputErrors({
          safe3PrivateKeyError: "请输入从 Safe3 桌面钱包导出的私钥"
        })
        setSafe3Wallet(undefined);
      }
    } else {
      setInputErrors(undefined);
      setSafe3Wallet(undefined);
    }
  }, [safe3PrivateKey]);

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 兑换
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type="info" message={<>
            <Text>使用该页面输入钱包私钥将 Safe3 网络的资产迁移到 Safe4 网络</Text><br />
          </>} />
          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text strong type="secondary">Safe3 钱包私钥</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Input size="large" onChange={(event) => {
                const value = event.target.value;
                if (isSafe3DesktopExportPrivateKey(value)) {
                  setSafe3PrivateKey(value);
                } else {
                  setSafe3PrivateKey(undefined);
                }
              }} onBlur={(event) => {
                const value = event.target.value;
                setSafe3PrivateKey(value);
              }} />
            </Col>
            {
              inputErrors && inputErrors.safe3PrivateKeyError && <>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Alert type="error" showIcon message={<>
                    {inputErrors.safe3PrivateKeyError}
                  </>} />
                </Col>
              </>
            }

            <Divider />

            <Col span={12}>
              <Col span={24}>
                <Text strong type="secondary">Safe3 钱包地址</Text><br />
              </Col>
              <Col span={24}>
                <Text strong>{safe3Wallet?.safe3Address}</Text><br />
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text strong type="secondary">账户余额</Text><br />
              </Col>
              <Col span={24}>
                <Text strong>213.213 SAFE</Text><br />
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text strong type="secondary">锁仓余额</Text><br />
              </Col>
              <Col span={24}>
                <Text strong>213.213 SAFE</Text><br />
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text strong type="secondary">主节点</Text><br />
              </Col>
              <Col span={24}>
                <Text strong>213.213 SAFE</Text><br />
              </Col>
            </Col>

            <Col span={12}>
              <Text strong type="secondary">Safe3 钱包地址 [公钥压缩]</Text><br />
              <Col span={24}>
                <Text strong>{safe3Wallet?.safe3CompressAddress}</Text><br />
              </Col>
            </Col>
            <Divider />
            <Col span={24}>
              <Alert type="info" showIcon message={<>
                您在 Safe3 网络的资产将会迁移到该私钥对应的 Safe4 网络的钱包地址上
              </>} />
              <Col span={24} style={{ marginTop: "20px" }}>
                <Text strong type="secondary">Safe4 钱包地址</Text><br />
              </Col>
              <Col span={24}>
                <Text strong>{safe3Wallet?.safe4Address}</Text><br />
              </Col>
              <Button style={{ marginTop: "20px" }} type="primary">迁移</Button>
            </Col>
          </Row>

        </Card>
      </div>
    </div>
  </>)

}
