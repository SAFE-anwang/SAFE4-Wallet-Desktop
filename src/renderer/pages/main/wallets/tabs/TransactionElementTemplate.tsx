
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { LoadingOutlined, FileDoneOutlined, LockOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import SAFE_LOGO from "../../../../assets/logo/SAFE.png";

const { Text } = Typography;


export default ({
    title, description, assetFlow, status, icon
}: {
    title: React.ReactNode | string,
    description: React.ReactNode | string,
    assetFlow: React.ReactNode,
    status?: number,
    icon?: React.ReactNode
}) => {
    return <>
        <span style={{ width: "100%" }}>
            <Row>
                <Col span={18}>
                    <Row style={{ width: "50px", float: "left" }}>
                        {
                            !status && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", float: "left", marginLeft: "-18px", marginTop: "-14px" }} />} >
                                <Avatar style={{ marginTop: "8px", background: icon ? "#e6e6e6" : "" }}
                                    src={icon ? icon : SAFE_LOGO} />
                            </Spin>
                        }
                        {
                            status == 1 && <Avatar style={{ marginTop: "8px", background: icon ? "#e6e6e6" : "" }}
                                src={icon ? icon : SAFE_LOGO} />
                        }
                    </Row>
                    <div>
                        <Text strong>{title}</Text><br />
                        <Text type="secondary">{description}</Text>
                    </div>
                </Col>
                <Col span={6} style={{ textAlign: "right", lineHeight: "42px" }}>
                    <Text strong>
                        {assetFlow}
                    </Text>
                </Col>
            </Row>
        </span>
    </>

}