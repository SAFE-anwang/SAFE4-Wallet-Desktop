import { SyncOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useTranslation } from "react-i18next";
import { NetworkType } from "../../../../assets/logo/NetworkLogo";

const { Text, Link } = Typography;

export default ({
  token , amount , targetNetwork , targetAddress,
  openCrosschainConfirmModal
}: {
  token : string  ,
  amount : string ,
  targetNetwork : NetworkType,
  targetAddress : string,
  openCrosschainConfirmModal : boolean

  }) => {

  const { t } = useTranslation();

  return <Modal footer={null} destroyOnClose title={t("wallet_crosschain")} open={openCrosschainConfirmModal} closable>
    <Divider />
    <Row >
      <Col span={24}>
        <SyncOutlined style={{ fontSize: "32px" }} />
        <Text style={{ fontSize: "32px", marginLeft: "5px" }} strong>{"5000.554"} SAFE</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_from")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>当前账户</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{"跨链到"}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{"BNB Smart Chain"}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{"0x000000000000000000000000000000000"}</Text>
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        <Alert type="info" message={<Row>
          <Col span={24}>
            <Text>需要先授权跨链合约访问您的USDT资产</Text>
            <Link style={{ float: "right" }}>点击授权</Link>
          </Col>
        </Row>} />
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24}>
        <Button style={{ float: "right" }} type="primary">广播交易</Button>
      </Col>
    </Row>
  </Modal>
}
