
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useCallback, useEffect, useState } from "react";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";
import Safe3Assets, { Safe3Asset } from "./Safe3Assets";
import { useSafe3Contract } from "../../../hooks/useContracts";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { ethers } from "ethers";

const { Text, Title } = Typography;

const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;
const isSafe3DesktopExportPrivateKey = (input: string) => {
  return base58Regex.test(input);
};

const steps = [
  {
    title: '验证私钥',
    content: 'First-content',
  },
  {
    title: '资产迁移',
    content: 'Second-content',
  },
];

export default () => {

  const [current, setCurrent] = useState(0);
  const items = steps.map((item) => ({ key: item.title, title: item.title }));

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

  const [safe3Asset, setSafe3Asset] = useState<Safe3Asset>();
  const safe3Contract = useSafe3Contract(true);

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

  useEffect(() => {
    setSafe3PrivateKey("XJ2M1PbCAifB8W91hcHDEho18kA2ByB4Jdmi4XBHq5sNgtuEpXr4")
  }, [])

  useEffect(() => {
    if (safe3Asset) {
      setCurrent(1)
    } else {
      setCurrent(0)
    }
  }, [safe3Asset]);

  const executeRedeem = useCallback(async () => {
    if (safe3Contract && safe3Wallet && safe3Asset) {
      const { safe3Address, availableSafe3Info, lockedNum, specialSafe3Info } = safe3Asset;
      const publicKey = safe3Wallet.safe3Address == safe3Address ? safe3Wallet.publicKey : safe3Wallet.compressPublicKey;
      const { privateKey } = safe3Wallet;
      const safe4Wallet = new ethers.Wallet(privateKey);
      const signMsg = await safe4Wallet.signMessage(publicKey);
      console.log(signMsg);
      // safe3 可用资产大于零,且没有被赎回.
      if ( // availableSafe3Info?.amount.greaterThan(ZERO) &&
        availableSafe3Info?.redeemHeight == 0) {
        safe3Contract.redeemAvailable(
          ethers.utils.toUtf8Bytes(publicKey),
          ethers.utils.toUtf8Bytes(signMsg) ,
          {
            gasLimit : 500000
          }
        ).then((data: any) => {
          console.log("execute success >>", data)
        }).catch((err: any) => {
          console.log("execute failed >>", err)
        })
      }
    }
  }, [safe3Wallet, safe3Asset, safe3Contract]);

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 资产迁移
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type="info" message={<>
            <Text>使用该页面输入钱包地址私钥将 Safe3 网络的资产迁移到 Safe4 网络</Text><br />
          </>} />
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />
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
                  setSafe3Asset(undefined);
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

            {
              safe3Wallet && <>
                <Divider />
                <Safe3Assets setSafe3Asset={setSafe3Asset} safe3Address={safe3Wallet?.safe3Address} safe3CompressAddress={safe3Wallet?.safe3CompressAddress} />
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
                  <Button
                    disabled={safe3Asset ? false : true}
                    style={{ marginTop: "20px" }} type="primary"
                    onClick={() => {
                      executeRedeem();
                    }}>
                    迁移
                  </Button>
                </Col>
              </>
            }
          </Row>

        </Card>
      </div>
    </div>
  </>)

}
