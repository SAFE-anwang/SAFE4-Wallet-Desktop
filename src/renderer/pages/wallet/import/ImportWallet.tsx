import { Button, Col, Divider, Row, Typography, Segmented, Input, Switch, Alert, Spin } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { HDNode } from "ethers/lib/utils";
import { applicationActionConfirmedImport } from "../../../state/application/action";
import Safe3PrivateKey from "../../../utils/Safe3PrivateKey";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export const Import_Type_PrivateKey = "ImportTypePrivateKey";
export const Import_Type_Mnemonic = "ImportTypeMnemonic";
export const Import_Type_Keystore = "ImportTypeKeystore";

const BIP44_Safe4_Path = "m/44'/60'/0'/0/0";
const privateKeyRegex = /^(0x)?[0-9a-fA-F]{64}$/;
const safe3Base58PrivateKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{52}$/;

const isValidPrivateKey = (inputPrivateKey: string) => {
  return {
    isEVMPrivateKey: privateKeyRegex.test(inputPrivateKey),
    isSafe3Base58PrivateKey: safe3Base58PrivateKeyRegex.test(inputPrivateKey)
  }
}

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [address, setAddress] = useState<string>();
  const [importType, setImportType] = useState<string>(Import_Type_Mnemonic);

  const importTypeOptions = [t("wallet_import_mnemonic"), t("wallet_import_privateKey"), t("wallet_import_keystore")];

  const [activePassword, setActivePassword] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<boolean>(false);

  const [keystoreDecrypting, setKeystoreDecrypting] = useState<boolean>(false);

  const goBackClick = () => {
    navigate("/selectCreateWallet")
  }
  const [params, setParams] = useState<{
    privateKey?: string,

    mnemonic?: string,
    password?: string,
    path: string,

    keystore?: string,
    keystorePWD?: string
  }>({
    path: BIP44_Safe4_Path
  });
  const [inputErrors, setInputErrors] = useState<{
    privateKey?: string,
    mnemonic?: string,
    path?: string,
    keystore?: string,
    keystorePWD ?: string
  }>();

  // spy inquiry science come omit pyramid license crew fossil bitter hotel gas
  //"m/44'/60'/0'/0/0"
  const handleImportMnemonicInput = (mnemonic: string | undefined, password: string | undefined, path: string) => {
    if (mnemonic && mnemonic != "") {
      try {
        if (ethers.utils.isValidMnemonic(mnemonic)) {
          setInputErrors({
            ...inputErrors,
            mnemonic: undefined
          });
          const wallet = HDNode.fromMnemonic(mnemonic, password, undefined).derivePath(path)
          setAddress(wallet.address)
        } else {
          setAddress(undefined);
          setInputErrors({
            ...inputErrors,
            mnemonic: t("wallet_import_mnemonic_invalid")
          })
        }
      } catch (err) {
        console.log("error :", err)
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
          privateKey: t("wallet_import_privateKey_invalid")
        })
      }
    } else {
      setInputErrors({
        ...inputErrors,
        privateKey: undefined
      })
    }
  }

  const validateKeystore = useCallback(() => {
    setInputErrors({
      ...inputErrors,
      keystore:undefined,
      keystorePWD:undefined
    });
    if (params.keystore) {
      const { keystore, keystorePWD } = params;
      setKeystoreDecrypting(true);
      ethers.Wallet.fromEncryptedJson(keystore, keystorePWD ? keystorePWD : "")
        .then(wallet => {
          setAddress(wallet.address);
          setParams({
            ...params,
            privateKey:wallet.privateKey
          })
          setKeystoreDecrypting(false);
        }).catch(err => {
          if ( err && err.message == 'invalid password' ){
            setInputErrors({
              ...inputErrors,
              keystorePWD:t("wallet_keystore_password_err")
            })
          } else {
            setInputErrors({
              ...inputErrors,
              keystore:err.message
            })
          }
          setKeystoreDecrypting(false);
        })
    } else {
      setInputErrors({
        ...inputErrors,
        keystore:t("wallet_import_keystore_err_input")
      })
    }
  }, [params.keystore, params.keystorePWD]);

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
          mnemonic: params.mnemonic,
          password: params.password,
          path: params.path
        }))
      } else if (importType == Import_Type_PrivateKey) {
        dispatch(applicationActionConfirmedImport({
          importType,
          address,
          privateKey: params.privateKey
        }));
      } else if ( importType == Import_Type_Keystore ){
        dispatch(applicationActionConfirmedImport({
          importType : Import_Type_PrivateKey,
          address,
          privateKey: params.privateKey
        }));
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
            }} strong>{t("wallet_import")}</Text>
            <br />
            <Text style={{
              fontSize: "28px"
            }} type="secondary" strong>{t("wallet_import_selectImportType")}</Text>
            <br />
            <Spin spinning={keystoreDecrypting}>
              <Row style={{ marginTop: "50px" }}>
                <Col span={24}>
                  <Segmented
                    options={importTypeOptions}
                    onChange={(value) => {
                      setAddress(undefined);
                      if (value == t("wallet_import_privateKey")) {
                        setImportType(Import_Type_PrivateKey)
                        setParams({
                          ...params,
                          privateKey: undefined
                        })
                      } else if (value == t("wallet_import_mnemonic")) {
                        setImportType(Import_Type_Mnemonic)
                        setActivePassword(false)
                        setActivePath(false)
                        setParams({
                          ...params,
                          mnemonic: undefined,
                          password: undefined,
                          path: BIP44_Safe4_Path
                        })
                      } else if (value == t("wallet_import_keystore")) {
                        setImportType(Import_Type_Keystore)
                        setParams({
                          ...params,
                          keystore: undefined,
                          keystorePWD : undefined
                        });
                        setInputErrors({
                          ...inputErrors,
                          keystore:undefined,
                          keystorePWD:undefined
                        })
                      }
                    }}
                  />
                </Col>

                {
                  importType == Import_Type_PrivateKey && <>
                    <Col style={{ marginTop: "20px" }} span={24}>
                      <Text type="secondary" strong>{t("wallet_privateKey")}</Text>
                      <Input.TextArea status={inputErrors?.privateKey ? "error" : ""}
                        onChange={(event) => {
                          const inputPrivateKey = event.target.value.trim();
                          const { isEVMPrivateKey, isSafe3Base58PrivateKey } = isValidPrivateKey(inputPrivateKey)
                          if (isEVMPrivateKey || isSafe3Base58PrivateKey) {
                            setParams({
                              ...params,
                              privateKey: isSafe3Base58PrivateKey ? Safe3PrivateKey(inputPrivateKey).privateKey : inputPrivateKey
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
                          const inputPrivateKey = event.target.value.trim();
                          const { isSafe3Base58PrivateKey } = isValidPrivateKey(inputPrivateKey);
                          setParams({
                            ...params,
                            privateKey: isSafe3Base58PrivateKey ? Safe3PrivateKey(inputPrivateKey).privateKey : inputPrivateKey
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
                      <Text type="secondary" strong>{t("wallet_mnemonic")}</Text>
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
                      <Text type="secondary" strong>{t("wallet_mnemonic_password")}</Text>
                      <Switch style={{ float: "right", marginBottom: "5px" }} checkedChildren={t("active")} unCheckedChildren={t("unactive")}
                        value={activePassword} onChange={setActivePassword} />
                      <Input.Password value={params.password} size="large" disabled={!activePassword} onChange={(event) => {
                        setParams({
                          ...params,
                          password: event.target.value
                        })
                      }} />
                    </Col>
                    <Col style={{ marginTop: "30px" }} span={24}>
                      <Text type="secondary" strong>BIP44-Path</Text>
                      <Switch style={{ float: "right", marginBottom: "5px" }} disabled checkedChildren="自定义" unCheckedChildren={t("default")}
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
                  importType == Import_Type_Keystore && <>
                    <Col style={{ marginTop: "20px" }} span={24}>
                      <Text type="secondary" strong>Keystore</Text>
                      <Input.TextArea value={params.keystore} status={inputErrors?.keystore ? "error" : ""} onChange={(event) => {
                        const inputKeystore = event.target.value.trim();
                        setParams({
                          ...params,
                          keystore: inputKeystore
                        });
                        setInputErrors({
                          ...inputErrors,
                          keystore:undefined
                        })
                      }} style={{ height: "100px" }} />
                      {
                        inputErrors?.keystore && <>
                          <Alert type="error" showIcon message={<>
                            {inputErrors.keystore}
                          </>} style={{ marginTop: "5px" }} />
                        </>
                      }
                    </Col>
                    <Col style={{ marginTop: "30px" }} span={24}>
                      <Text type="secondary" strong>{t("wallet_keystore_password")}</Text>
                      <Input.Password value={params.keystorePWD} size="large" onChange={(event) => {
                        setParams({
                          ...params,
                          keystorePWD: event.target.value
                        });
                        setInputErrors({
                          ...inputErrors,
                          keystorePWD:undefined
                        })
                      }}/>
                       {
                        inputErrors?.keystorePWD && <>
                          <Alert type="error" showIcon message={<>
                            {inputErrors.keystorePWD}
                          </>} style={{ marginTop: "5px" }} />
                        </>
                      }
                    </Col>
                    {
                      !address && <Col style={{ marginTop: "30px" }} span={24}>
                        <Button type="primary" onClick={validateKeystore}>{t("validate")}</Button>
                      </Col>
                    }
                  </>
                }

                {
                  address && <Col style={{ marginTop: "30px" }} span={24}>
                    <Alert type="success" message={<>
                      <Text type="secondary">{t("wallet_address")}</Text><br />
                      <Text strong>
                        {address}
                      </Text>
                    </>} />
                  </Col>
                }

                {
                  (importType == Import_Type_Mnemonic || importType == Import_Type_PrivateKey || (importType == Import_Type_Keystore && address) ) &&
                  <Col style={{ marginTop: "30px" }} span={24}>
                    <Button type="primary" disabled={!address} onClick={importWallet}>{t("confirm")}</Button>
                  </Col>
                }

              </Row>
            </Spin>

          </Col>

          <Col span={4}>
            <Divider style={{ height: "100%", float: "right", border: "2px solid #ededed" }} type="vertical" />
          </Col>

        </Row>
      </Col>
    </Row>
  </>

}
