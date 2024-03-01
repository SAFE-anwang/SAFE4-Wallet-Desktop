import { Button, Col, Divider, Row, Typography, Segmented, Input, Switch, Alert } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { applicationActionConfirmedImport } from "../../../state/application/action";

const { Text } = Typography;

export const Import_Type_PrivateKey = "ImportTypePrivateKey";
export const Import_Type_Mnemonic = "ImportTypeMnemonic";
const BIP44_Safe4_Path = "m/44'/60'/0'/0/0";
const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [address, setAddress] = useState<string>();
  const [importType, setImportType] = useState<string>(Import_Type_Mnemonic);
  const importTypeOptions = ["导入助记词", "导入私钥"];

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
  const [inputErrors, setInputErrors] = useState<{
    privateKey?: string,
    mnemonic?: string,
    path?: string
  }>();

  // spy inquiry science come omit pyramid license crew fossil bitter hotel gas
  //"m/44'/60'/0'/0/0"
  const handleImportMnemonicInput = (mnemonic: string | undefined, password: string | undefined, path: string) => {
    if (mnemonic && mnemonic != "") {
      if (ethers.utils.isValidMnemonic(mnemonic)) {
        setInputErrors({
          ...inputErrors,
          mnemonic: undefined
        })
        const wallet = HDNode.fromMnemonic(mnemonic, password, undefined).derivePath(path)
        setAddress(wallet.address)
      } else {
        setAddress(undefined);
        setInputErrors({
          ...inputErrors,
          mnemonic: "无效的助记词"
        })
      }
    } else {
      setInputErrors({
        ...inputErrors,
        mnemonic: undefined
      })
    }
  }

  // 910a8a314c19ce07018da04970bb83c82d6f9a8062acc80f9aa1f786be6c2607
  const handleImportPrivateKey = (privateKey?: string) => {
    if (privateKey) {
      if (privateKeyRegex.test(privateKey)) {
        setInputErrors({
          ...inputErrors,
          privateKey: undefined
        })
        try {
          const wallet = new ethers.Wallet(privateKey);
          setAddress(wallet.address)
        } catch (err: any) {
          setAddress(undefined)
        }
      } else {
        setAddress(undefined)
        setInputErrors({
          ...inputErrors,
          privateKey: "无效的私钥"
        })
      }
    } else {
      setInputErrors({
        ...inputErrors,
        privateKey: undefined
      })
    }
  }

  useEffect(() => {
    if (importType == Import_Type_Mnemonic) {
      handleImportMnemonicInput(params.mnemonic, params.password, params.path)
    } else if (importType == Import_Type_PrivateKey) {
      handleImportPrivateKey(params.privateKey);
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
  }, [activePath]);

  const importWallet = () => {
    if (address) {
      if (importType == Import_Type_Mnemonic) {
        dispatch(applicationActionConfirmedImport({
          importType,
          address,
          mnemonic : params.mnemonic,
          password : params.password,
          path : params.path
        }))
      } else if (importType == Import_Type_PrivateKey) {
        dispatch(applicationActionConfirmedImport({
          importType,
          address,
          privateKey: params.privateKey
        }))
      }
      navigate("/waitingImportWallet")
    }
  }

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
                      setImportType(Import_Type_PrivateKey)
                      setParams({
                        ...params,
                        privateKey: undefined
                      })
                    } else {
                      setImportType(Import_Type_Mnemonic)
                      setActivePassword(false)
                      setActivePath(false)
                      setParams({
                        ...params,
                        mnemonic: undefined,
                        password: undefined,
                        path: BIP44_Safe4_Path
                      })
                    }
                    setAddress(undefined)
                  }}
                />
              </Col>
              {
                importType == Import_Type_PrivateKey && <>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Text type="secondary" strong>私钥</Text>
                    <Input.TextArea status={inputErrors?.privateKey ? "error" : ""}
                      onChange={(event) => {
                        const inputPrivateKey = event.target.value;
                        if (privateKeyRegex.test(inputPrivateKey)) {
                          setParams({
                            ...params,
                            privateKey: event.target.value
                          })
                        } else {
                          setAddress(undefined)
                          setParams({
                            ...params,
                            privateKey: undefined
                          })
                        }
                      }}
                      onBlur={(event) => {
                        setParams({
                          ...params,
                          privateKey: event.target.value
                        })
                      }}
                      style={{ height: "100px" }} />
                    {
                      inputErrors?.privateKey && <>
                        <Alert type="error" showIcon message={<>
                          {inputErrors.privateKey}
                        </>} style={{ marginTop: "5px" }} />
                      </>
                    }
                  </Col>
                </>
              }
              {
                importType == Import_Type_Mnemonic && <>
                  <Col style={{ marginTop: "20px" }} span={24}>
                    <Text type="secondary" strong>助记词</Text>
                    <Input.TextArea status={inputErrors?.mnemonic ? "error" : ""} onChange={(event) => {
                      const inputMnemonic = event.target.value;
                      if (ethers.utils.isValidMnemonic(inputMnemonic)) {
                        setParams({
                          ...params,
                          mnemonic: event.target.value
                        })
                      } else {
                        setAddress(undefined);
                        setParams({
                          ...params,
                          mnemonic: undefined
                        });
                      }
                    }} onBlur={(event) => {
                      setParams({
                        ...params,
                        mnemonic: event.target.value
                      })
                    }} style={{ height: "100px" }} />
                    {
                      inputErrors?.mnemonic && <>
                        <Alert type="error" showIcon message={<>
                          {inputErrors.mnemonic}
                        </>} style={{ marginTop: "5px" }} />
                      </>
                    }

                  </Col>
                  <Col style={{ marginTop: "30px" }} span={24}>
                    <Text type="secondary" strong>密码</Text>
                    <Switch style={{ float: "right", marginBottom: "5px" }} checkedChildren="开启" unCheckedChildren="关闭"
                      value={activePassword} onChange={setActivePassword} />
                    <Input.Password value={params.password} size="large" disabled={!activePassword} onChange={(event) => {
                      setParams({
                        ...params,
                        password: event.target.value
                      })
                    }} />
                  </Col>
                  <Col style={{ marginTop: "30px" }} span={24}>
                    <Text type="secondary" strong>BIP-44 Path</Text>
                    <Switch style={{ float: "right", marginBottom: "5px" }} disabled checkedChildren="自定义" unCheckedChildren="默认"
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
                address && <Col style={{ marginTop: "30px" }} span={24}>
                  <Alert type="success" message={<>
                    <Text type="secondary">钱包地址</Text><br />
                    <Text strong>
                      {address}
                    </Text>
                  </>} />
                </Col>
              }

              <Col style={{ marginTop: "30px" }} span={24}>
                <Button type="primary" disabled={!address} onClick={importWallet}>确认</Button>
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
