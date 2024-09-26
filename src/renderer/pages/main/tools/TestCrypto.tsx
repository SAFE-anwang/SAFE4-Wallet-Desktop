import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";
import { useWalletsKeystores } from "../../../state/wallets/hooks";
import { useApplicationPassword } from "../../../state/application/hooks";
import { ethers } from "ethers";

const { Text, Title } = Typography

const base58 = "";

export default () => {

  const [scryptResult, setScryptResult] = useState<string>();

  const walletList = useWalletsKeystores();
  const applicationPassword = useApplicationPassword();

  const doScrypt = async () => {
    const encrypt = JSON.parse(
      ethers.utils.toUtf8String(
        ethers.utils.base58.decode(base58)
      )
    );
    console.log("encrypt ::" , encrypt)
    await window.electron.crypto.scrypt({});
    // setScryptResult(result);
  }

  useEffect(() => {
    if (walletList && applicationPassword) {
      doScrypt();
    }
  }, [walletList, applicationPassword]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Test
        </Title>
      </Col>
    </Row>
    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%", height: "800px" }}>
        <Text>  {scryptResult} </Text>
      </Card>
    </Row>
  </>

}

