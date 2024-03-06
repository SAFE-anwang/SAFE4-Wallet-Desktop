
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useEffect, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";


const { Text, Title } = Typography;


export default () => {
  const [safe3PrivateKey, setSafe3PrivateKey] = useState<string>();
  const [safe3Wallet, setSafe3Wallet] = useState<{
    privateKey: string,
    publicKey: string,
    compressPublicKey: string,
    safe3Address: string,
    safe3CompressAddress: string,
    safe4Address: string
  }>();

  useEffect(() => {
    const result = Safe3PrivateKey("XJ2M1PbCAifB8W91hcHDEho18kA2ByB4Jdmi4XBHq5sNgtuEpXr4");
    console.log("result >> :", result);
  }, [])
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
            <Text>使用Safe3网络的钱包地址的私钥对信息进行签名</Text><br />
            <Text>验证通过的签名信息会将Safe3网络的锁仓置换到Safe4网络的钱包地址上</Text>
          </>} />
          <Row style={{marginTop:"50px"}}>
            <Col span={24}>
              <Text strong type="secondary">Safe3 钱包私钥</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Input size="large" />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Alert type="error" showIcon message={<>
                请输入从 Safe 桌面钱包导出的私钥地址
              </>} />
            </Col>
            <Divider />
            <Col span={12}>
              <Text strong type="secondary">Safe3 钱包地址</Text><br />
              dsads
            </Col>
            <Col span={12}>
              <Text strong type="secondary">Safe4 钱包地址</Text><br />
              dsads
            </Col>
            <Divider />
          </Row>

        </Card>
      </div>
    </div>
  </>)

}
