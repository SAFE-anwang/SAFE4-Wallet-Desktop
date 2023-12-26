import { Button, Col, Divider, Input, Row, Tag, Typography } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";

const { Text } = Typography;


export default () => {

    const navigate = useNavigate();

    const goBackClick = () => {
        navigate("/")
    }
    const goNextClick = () => {
        navigate("/wallet/createMnemonic")
    }

    return <>
        <Button size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
        <Row style={{
            marginTop: "40px"
        }}>
            <Col span={14}>
                <Row>
                    <Col span={20}>
                        <Text style={{
                            fontSize: "28px"
                        }} strong>设置密码</Text>
                        <br /> <br /> <br /> <br />
                        <Input.Password placeholder="至少8位字符" size="large" style={{
                            height: "56px"
                        }} />
                        <br /> <br /> <br />
                        <Input.Password placeholder="确认密码" size="large" style={{
                            height: "56px"
                        }} />
                        <br /> <br /> <br />
                        <Button onClick={goNextClick} style={{
                            width: "100%", height: "56px", fontSize: "18px" , background:"#2bbb2b" , color:"white"
                        }}>继续</Button>
                    </Col>
                    <Col span={4}>
                        <Divider style={{ height: "100%", float: "right", border: "2px solid #ededed" }} type="vertical" />
                    </Col>
                </Row>
            </Col>
            <Col span={10} style={{
                paddingLeft: "20px"
            }}>
                <Tag style={{
                    width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                    <LockOutlined style={{
                        color: "green", marginTop: "12px", marginLeft: "6px"
                    }} />
                </Tag>
                <br /><br /><br />
                <Text style={{ fontSize: "18px" }}>
                    您的数据将使用此密码加密，确认交易和解锁钱包也会使用该密码。
                </Text>
                <br /><br />
                <Text style={{ fontSize: "18px" }}>
                    密码安全地存储在您的设备上。我们无法为您恢复密码，
                    <Text strong type="danger" style={{ fontSize: "20px" }}>所以请务必记住它！</Text>
                </Text>
            </Col>
        </Row>
    </>
}
