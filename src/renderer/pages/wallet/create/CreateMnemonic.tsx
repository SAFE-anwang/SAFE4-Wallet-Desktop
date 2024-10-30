import { Button, Card, Col, Divider, Input, Row, Tag, Typography } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { IPC_CHANNEL } from "../../../config";
import { WalletSignal, Wallet_Methods } from "../../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { applicationActionConfirmedMnemonic } from "../../../state/application/action";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [mnemonic, setMnemonic] = useState<string>();
  const mnemonicArr = useMemo(() => {
    if (mnemonic) {
      return mnemonic.split(" ");
    }
    return [];
  }, [mnemonic]);

  useEffect(() => {
    const method = Wallet_Methods.generateMnemonic;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL,
      [WalletSignal, method,
        [12]
      ]
    );
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal && arg[1] == method) {
        const mnemonic = arg[2][0];
        setMnemonic(mnemonic);
      }
    });
  }, []);

  const goBackClick = () => {
    navigate("/selectCreateWallet")
  }
  const goNextClick = () => {
    if (mnemonic) {
      dispatch(applicationActionConfirmedMnemonic({ mnemonic }))
      navigate("/waitingCreateWallet")
    }
  }

  return <>
    <Button style={{ marginTop: "10%" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
    <Row style={{
      marginTop: "20px"
    }}>
      <Col span={14}>
        <Row style={{ height: "400px" }}>
          <Col span={20}>
            <Text style={{
              fontSize: "28px"
            }} strong>{t("wallet_mnemonic")}</Text>
            <br />
            <Text style={{
              fontSize: "28px"
            }} type="secondary" strong>{t("wallet_mnemonic_tip0")}</Text>
            <br /> <br /><br />

            <Row>
              <Col span={4}>
                <Tag style={{
                  width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                  <LockOutlined style={{
                    color: "green", marginTop: "12px", marginLeft: "6px"
                  }} />
                </Tag>
              </Col>
              <Col span={20}>
                <Text style={{
                  lineHeight: "52px"
                }}>{t("wallet_mnemonic_tip1")}</Text>
              </Col>
            </Row>
            <br />
            <Row>
              <Col span={4}>
                <Tag style={{
                  width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                  <LockOutlined style={{
                    color: "green", marginTop: "12px", marginLeft: "6px"
                  }} />
                </Tag>
              </Col>
              <Col span={20}>
                <Text style={{
                  lineHeight: "52px"
                }}>{t("wallet_mnemonic_tip2")}</Text>
              </Col>
            </Row>
            <br />
            <Row>
              <Col span={4}>
                <Tag style={{
                  width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                  <LockOutlined style={{
                    color: "green", marginTop: "12px", marginLeft: "6px"
                  }} />
                </Tag>
              </Col>
              <Col span={20}>
                <Text style={{
                  lineHeight: "52px"
                }}>{t("wallet_mnemonic_tip3")}</Text>
              </Col>
            </Row>
            <br />
            <Row>
              <Col span={4}>
                <Tag style={{
                  width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                  <LockOutlined style={{
                    color: "green", marginTop: "12px", marginLeft: "6px"
                  }} />
                </Tag>
              </Col>
              <Col span={20}>
                <Text style={{
                  lineHeight: "52px"
                }}>{t("wallet_mnemonic_tip4")}</Text>
              </Col>
            </Row>
          </Col>
          <Col span={4}>
            <Divider style={{ height: "100%", float: "right", border: "2px solid #ededed" }} type="vertical" />
          </Col>
        </Row>
      </Col>
      <Col span={10} style={{
        paddingLeft: "20px"
      }}>
        {
          !showMnemonic && <Row>
            <Text style={{
              margin: "auto", marginTop: "180px"
            }}>{t("wallet_mnemonic_tip5")}</Text>
            <Button style={{
              marginTop: "18px", width: "100%"
            }} type="dashed" disabled={mnemonic ? false : true} onClick={() => setShowMnemonic(true)}>{t("wallet_mnemonic_query")}</Button>
          </Row>
        }
        {
          showMnemonic && <Row>
            <Col span={24}>
              <Card>
                <Row>
                  {
                    mnemonic && mnemonicArr.map((word, index) => {
                      return <Col key={word + index} span={10} style={{ margin: "4px" }}>
                        <Row>
                          <Col span={5}><Text strong type="secondary">{(index + 1)}.</Text></Col>
                          <Col span={19}><Text strong>{word}</Text></Col>
                        </Row>
                      </Col>
                    })
                  }
                </Row>
              </Card>
            </Col>
            <Col span={24} style={{ marginTop: "60px", textAlign: "center" }} >
              <Text style={{
                textAlign: "center"
              }}>{t("wallet_mnemonic_keepStoreTip")}</Text>
              <Button style={{
                marginTop: "12px", width: "100%"
              }} type="primary" onClick={() => goNextClick()}>
                {t("wallet_mnemonic_stored")}
              </Button>
            </Col>
          </Row>
        }
      </Col>
    </Row>
  </>
}
