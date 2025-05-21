import { NumberOutlined } from "@ant-design/icons"
import { Alert, Badge, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useState } from "react";
import { useTranslation } from "react-i18next";
import VersionModal from "./VersionModal";

const { Title, Text, Link } = Typography;

export default () => {
  const { t } = useTranslation();
  const [openVersionModal, setOpenVersionModal] = useState(false);

  return <>
    <Row className='menu-item' onClick={() => {
      setOpenVersionModal(true);
    }}>
      <Col span={2} style={{ textAlign: "center" }}>
        <Badge dot style={{ width: "8px", height: "8px" }}>
          <NumberOutlined />
        </Badge>
      </Col>
      <Col span={20}>
        <Text strong>{t("version")} 2.0.3</Text>
        <Text type='secondary'><Divider type='vertical' />有新的版本可以更新</Text>
      </Col>
    </Row>
    <VersionModal openVersionModal={openVersionModal} setOpenVersionModal={setOpenVersionModal} />
  </>
}
