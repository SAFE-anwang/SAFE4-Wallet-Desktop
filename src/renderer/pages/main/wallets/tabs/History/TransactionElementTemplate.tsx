
import { Col, Row, Avatar, List, Typography, Modal, Button, Badge } from "antd";
import { LoadingOutlined, FileDoneOutlined, LockOutlined, ClockCircleOutlined, CloseCircleFilled } from '@ant-design/icons';
import { Spin } from 'antd';
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { ReactNode } from "react";

const { Text } = Typography;


export default ({
  title, description, assetFlow, status, icon, iconOutput
}: {
  title: React.ReactNode | string,
  description: React.ReactNode | string,
  assetFlow: React.ReactNode,
  status?: number,
  icon?: React.ReactNode,
  iconOutput?: () => ReactNode
}) => {

  const outputLogo = () => {
    if (iconOutput) {
      return iconOutput();
    }
    return <Avatar style={{ marginTop: "8px", background: icon ? "#e6e6e6" : "" }} src={icon ? icon : SAFE_LOGO} />
  }

  return <>
    <span style={{ width: "100%" }}>
      <Row>
        <Col span={18}>
          <Row style={{ width: "50px", float: "left" }}>
            {
              !status && status != 0 && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", float: "left", marginLeft: "-18px", marginTop: "-14px" }} />} >
                <Avatar style={{ marginTop: "8px", background: icon ? "#e6e6e6" : "" }}
                  src={icon ? icon : SAFE_LOGO} />
              </Spin>
            }
            {
              status == 1 && <>
                { outputLogo() }
              </>
            }
            {
              status == 0 &&
              <Badge title="失败" size="default" count={<CloseCircleFilled style={{ color: '#f5222d', top: "12px" }} />}>
                <Avatar style={{ marginTop: "8px", background: icon ? "#e6e6e6" : "" }}
                  src={icon ? icon : SAFE_LOGO} />
              </Badge>
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
