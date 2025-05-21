

import { NumberOutlined } from "@ant-design/icons"
import { Alert, Badge, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useTranslation } from "react-i18next";

const { Title, Text, Link } = Typography;


export default ( {
  openVersionModal , setOpenVersionModal
} : {
  openVersionModal : boolean ,
  setOpenVersionModal : ( openVersionModal : boolean ) => void
} ) => {

  const cancel = () => {
    setOpenVersionModal(false);
  }

  return <>
    <Modal title="版本更新" open={openVersionModal} footer={null} destroyOnClose onCancel={cancel}>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">最新版本</Text><br />
          <Text strong>2.0.4</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Text type="secondary">更新日志</Text>
          <ul style={{ marginTop: "5px" }}>
            <li>更新内存敏感信息存储</li>
            <li>优化投票逻辑</li>
          </ul>
        </Col>
        <Col span={24}>
          <Text type="secondary">下载链接</Text><br />
          <Link onClick={() => window.open("https://www.anwang.com/download/safe4_wallet/SAFE4-Wallet-Desktop Setup 2.0.3.exe")}>
            https://www.anwang.com/download/safe4_wallet/SAFE4-Wallet-Desktop Setup 2.0.3.exe
          </Link>
          <Alert style={{ marginTop: "5px" }} type="info" message={"下载最新钱包后,关闭钱包程序,运行新版本安装文件即可."} />
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Button onClick={cancel} style={{ float: "right" }}>关闭</Button>
        </Col>
      </Row>
    </Modal>
  </>

}
