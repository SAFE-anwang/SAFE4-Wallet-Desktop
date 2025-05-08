import { Col, Divider, Modal, Row, Spin, Typography } from "antd"
import useSRC20Prop from "../../../hooks/useSRC20Prop"

const { Text } = Typography;

export default ({
  openPromotionModal, setOpenPromotionModal,
  address
}: {
  openPromotionModal: boolean,
  setOpenPromotionModal: (openPromotionModal: boolean) => void,
  address: string
}) => {

  const { src20TokenProp, loading } = useSRC20Prop(address);
  const cancel = () => {
    setOpenPromotionModal(false);
  }

  return <>
    <Modal open={openPromotionModal} footer={null} title="推广资产" destroyOnClose onCancel={cancel}>
      <Divider />
      <Spin spinning={loading}>
        <Row>
          <Col span={12}>
            <Text type="secondary">资产名称</Text>
            <br />
            <Text strong>{src20TokenProp?.name}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">资产符号</Text>
            <br />
            <Text strong>{src20TokenProp?.symbol}</Text>
          </Col>
        </Row>
      </Spin>
    </Modal>
  </>

}
