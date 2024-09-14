import { Button, Col, Divider, Row , Typography} from "antd"

const { Text, Title } = Typography

export default () => {

  return <>
    <Row style={{ marginTop: "20px" }}>
      <Col span={24}>
        <Text strong>第一步</Text>
        <br />
        <Text>打开 Safe3 桌面钱包,并等待钱包同步到最新高度</Text>
      </Col>
      <br />
      <Col span={24}>
        <Text strong>第二步</Text>
        <br />
        <Text>解锁钱包</Text>
      </Col>
      <Col span={24}>
        <Text strong>第三步</Text>
        <br />
        <Text>输入命令,将私钥信息导出到</Text>
      </Col>
      <Col span={24}>
        <Text strong>第四步</Text>
        <br />
        <Text>点击 加载私钥 按钮,由钱包加载私钥</Text>
      </Col>
    </Row>
    <Divider />
    <Button type="primary">
      加载私钥
    </Button>
  </>

}
