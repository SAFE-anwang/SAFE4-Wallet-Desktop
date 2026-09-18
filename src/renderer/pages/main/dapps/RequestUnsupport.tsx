import { Alert, Button, Card, Col, Divider, Row, Typography } from "antd"
import { DAppRequest } from "../../../../main/DappRequestIpc"
import RequestCommonRender from "./RequestCommonRender"
import { useEffect } from "react";

const { Text } = Typography;

export default ({
  dAppRequest,
  onClose
}: {
  dAppRequest: DAppRequest,
  onClose: () => void
}) => {

  const reject = () => {
    window.electron.dapp.response(dAppRequest.requestId, false, null);
    onClose();;
  }

  return <>
    <Row>
      <RequestCommonRender dAppRequest={dAppRequest} />
      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text><br />
        <Card title={<>
          <Alert type="warning" message="不支持的 dApp 请求" />
        </>} style={{ marginTop: "5px" }}>
          <Text>当前钱包不支持 dApp 请求的操作。</Text>
        </Card>
      </Col>
      <Divider />
      <Col span={24} style={{ marginTop: "10px" }}>
        <Button onClick={reject} type="dashed" style={{ width: "100%" }}>关闭</Button>
      </Col>
    </Row>
  </>

}
