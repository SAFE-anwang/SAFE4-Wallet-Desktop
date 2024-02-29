import { Button, Col, Divider, Row, Typography, Segmented, Input, Switch, Alert } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { HDNode } from "ethers/lib/utils";

const { Text } = Typography;

const Import_Type_PrivateKey = "ImportTypePrivateKey";
const Import_Type_Mnemonic = "ImportTypeMnemonic";
const BIP44_Safe4_Path = "m/44'/60'/0'/0/0";

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [address, setAddress] = useState<string>();
  const [importType, setImportType] = useState<string>(Import_Type_Mnemonic);
  const importTypeOptions = importType == Import_Type_PrivateKey ?
    ["导入私钥", "导入助记词"] :
    ["导入助记词", "导入私钥"];

  const [activePassword, setActivePassword] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<boolean>(false);

  const goBackClick = () => {
    navigate("/selectCreateWallet")
  }

  const [params, setParams] = useState<{
    privateKey?: string,
    mnemonic?: string,
    password?: string,
    path: string
  }>({
    path: BIP44_Safe4_Path
  });

  const handlePrivateKeyInput = useCallback((inputPrivateKey: string) => {
    const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
    if (inputPrivateKey) {
      if (privateKeyRegex.test(inputPrivateKey)) {
        try {
          const wallet = new ethers.Wallet(inputPrivateKey);
          setAddress(wallet.address)
          setParams({
            ...params,
            privateKey: inputPrivateKey
          })
        } catch (err: any) {
          setAddress(undefined)
        }
      } else {
        setAddress(undefined)
      }
    } else {

    }
  }, []);

  // spy inquiry science come omit pyramid license crew fossil bitter hotel gas
  //"m/44'/60'/0'/0/0"
  const handleImportMnemonicInput = (mnemonic: string, password: string | undefined, path: string) => {
    if (mnemonic) {
      if (ethers.utils.isValidMnemonic(mnemonic)) {
        const wallet = HDNode.fromMnemonic(mnemonic,password,undefined).derivePath(path)
        setAddress(wallet.address)
      } else {
        console.log("invalid mnemonic")
      }
    }
  }

  // 910a8a314c19ce07018da04970bb83c82d6f9a8062acc80f9aa1f786be6c2607
  const handleImportPrivateKey = (privateKey: string) => {
    const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
    if (privateKey) {
      if (privateKeyRegex.test(privateKey)) {
        try {
          const wallet = new ethers.Wallet(privateKey);
          setAddress(wallet.address)
        } catch (err: any) {
          setAddress(undefined)
        }
      } else {
        setAddress(undefined)
      }
    } else {

    }
  }

  useEffect(() => {
    if (importType == Import_Type_Mnemonic) {
      if (params?.mnemonic) {
        const mnemonic = params.mnemonic;
        handleImportMnemonicInput(mnemonic, params.password, params.path)
      }
    } else if (importType == Import_Type_PrivateKey) {
      if (params?.privateKey) {
        const privateKey = params.privateKey;
        handleImportPrivateKey(privateKey);
      }
    }
  }, [importType, params]);
  useEffect(() => {
    if (!activePassword) {
      setParams({
        ...params,
        password: undefined
      })
    }
  }, [activePassword]);
  useEffect(() => {
    if (!activePath) {
      setParams({
        ...params,
        path: BIP44_Safe4_Path
      })
    }
  }, [activePath])

  return <>
    <Button style={{ marginTop: "10%" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
    <Row style={{
      marginTop: "20px"
    }}>
      <Col span={14}>
        <Row>
          <Col span={20}>
            <Text style={{
              fontSize: "28px"
            }} strong>导入钱包</Text>
            <br />
            <Text style={{
              fontSize: "28px"
            }} type="secondary" strong>选择导入方式</Text>
            <br />
            <Row style={{ marginTop: "50px" }}>
              <Col span={24}>
                <Segmented
                  options={importTypeOptions}
                  onChange={(value) => {
                    if (value == '导入私钥') {
                      setParams({
                        ...params,
                        privateKey: undefined
                      })
                      setImportType(Import_Type_PrivateKey)
                      setAddress(undefined)
                    } else {
                      setParams({
                        ...params,
                        mnemonic: undefined,
                        password: undefined,
                        path: BIP44_Safe4_Path
                      })
                      setAddress(undefined)
                      setActivePassword(false)
                      setActivePath(false)
                      setImportType(Import_Type_Mnemonic)
                    }
                  }}
                />
              </Col>
              {
                importType == Import_Type_PrivateKey && <>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Input.TextArea onChange={(input) => {
                      setParams({
                        ...params,
                        privateKey: input.target.value
                      })
                    }} style={{ height: "100px" }} />
                  </Col>
                </>
              }
              {
                importType == Import_Type_Mnemonic && <>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Input.TextArea onBlur={(event) => {
                      setParams({
                        ...params,
                        mnemonic: event.target.value
                      })
                    }} style={{ height: "100px" }} />
                  </Col>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Text>密码</Text>
                    <Switch style={{ float: "right", marginBottom: "5px" }} checkedChildren="开启" unCheckedChildren="关闭"
                      value={activePassword} onChange={setActivePassword} />
                    <Input.Password value={params.password} size="large" disabled={!activePassword} onChange={(event) => {
                      setParams({
                        ...params,
                        password: event.target.value
                      })
                    }} />
                  </Col>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Text>BIP44 Path</Text>
                    <Switch style={{ float: "right", marginBottom: "5px" }} checkedChildren="自定义" unCheckedChildren="默认"
                      value={activePath} onChange={setActivePath} />
                    <Input size="large" value={params.path} disabled={!activePath} onChange={(event) => {
                      setParams({
                        ...params,
                        path: event.target.value
                      })
                    }} />
                  </Col>
                </>
              }
              {
                address && <Col style={{ marginTop: "20px" }} span={24}>
                  <Alert type="warning" message={<>
                    <Text type="secondary">钱包地址</Text><br />
                    <Text strong>
                      {address}
                    </Text>
                  </>} />
                </Col>
              }

              <Col style={{ marginTop: "20px" }} span={24}>
                <Button type="primary" disabled={!address}>确认</Button>
              </Col>
            </Row>
          </Col>

          <Col span={4}>
            <Divider style={{ height: "100%", float: "right", border: "2px solid #ededed" }} type="vertical" />
          </Col>

        </Row>
      </Col>
    </Row>
  </>

}
