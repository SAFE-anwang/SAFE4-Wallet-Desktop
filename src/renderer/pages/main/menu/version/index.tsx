import { NumberOutlined } from "@ant-design/icons"
import { Badge, Col, Divider, Row, Typography } from "antd"
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();

  return <>
    <Row className='menu-item' onClick={() => {
    }}>
      <Col span={2} style={{ textAlign: "center" }}>
        <Badge dot style={{ width: "6px", height: "6px" }}>
          <NumberOutlined />
        </Badge>
      </Col>
      <Col span={20}>
        <Text strong>{t("version")} 2.0.3</Text>
        <Text type='secondary'><Divider type='vertical' />有新的版本可以更新</Text>
      </Col>
    </Row>
  </>
}
