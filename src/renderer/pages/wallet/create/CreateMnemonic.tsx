import { Button, Card, Col, Divider, Input, Row, Tag, Typography } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { IPC_CHANNEL } from "../../../config";
import { WalletSignal } from "../../../../main/handlers/WalletSignalHandler";
import { useDispatch } from "react-redux";
import { Application_Confirmed_Mnemonic } from "../../../state/application/action";

const { Text } = Typography;

export default () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
    const [mnemonic, setMnemonic] = useState<string>();
    const mnemonicArr = useMemo( () => {
        if ( mnemonic ){
            return mnemonic.split(" ");
        }
        return [];
    } , [mnemonic] );

    useEffect(() => {
        const method = 'generateMnemonic';
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, 'generateMnemonic', [12]]);
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
        if (mnemonic){
            dispatch(Application_Confirmed_Mnemonic( {mnemonic} ))
            navigate("/waitingCreateWallet")
        }
    }

    return <>
        <Button style={{marginTop:"12px"}} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
        <Row style={{
            marginTop: "20px"
        }}>
            <Col span={14}>
                <Row>
                    <Col span={20}>
                        <Text style={{
                            fontSize: "28px"
                        }} strong>助记词</Text>
                        <br />
                        <Text style={{
                            fontSize: "28px"
                        }} type="secondary" strong>阅读以下内容，然后安全地保存助记词</Text>
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
                                    lineHeight: "46px"
                                }}>仅通过助记词就可以完全访问您的钱包和资产。</Text>
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
                                <Text>如果您忘记了密码，您可以使用助记词重新找回您的钱包。</Text>
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
                                    lineHeight: "46px"
                                }}>任何官方都永远不会询问您的助记词。</Text>
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
                                    lineHeight: "46px"
                                }}>永远不要分享给任何人。</Text>
                            </Col>
                        </Row>
                        <br />

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
                        }}>请阅读左侧的信息，然后点击下面的按钮</Text>
                        <Button style={{
                            marginTop: "18px", width: "100%"
                        }} type="dashed" disabled={mnemonic ? false : true} onClick={() => setShowMnemonic(true)}>查看助记词</Button>
                    </Row>
                }
                {
                    showMnemonic && <Row>
                        <Col span={24}>
                            <Card>
                                <Row>
                                    {
                                        mnemonic && mnemonicArr.map(( word , index ) => {
                                            return <Col key={word+index} span={10} style={{ margin: "4px" }}>
                                                <Row>
                                                    <Col span={5}><Text strong type="secondary">{(index+1)}.</Text></Col>
                                                    <Col span={19}><Text strong>{word}</Text></Col>
                                                </Row>
                                            </Col>
                                        })
                                    }
                                </Row>
                            </Card>
                        </Col>

                        <Col span={24} style={{ marginTop: "120px" }}>
                            <Text style={{
                                marginLeft: "96px"
                            }}>请妥善保存助记词</Text>
                            <Button style={{
                                marginTop: "12px", width: "100%"
                            }} type="primary" onClick={() => goNextClick()}>我已保存助记词</Button>
                        </Col>

                    </Row>
                }
            </Col>
        </Row>
    </>
}
