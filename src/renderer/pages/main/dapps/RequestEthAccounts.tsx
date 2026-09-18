import { DAppRequest } from "../../../../main/DappRequestIpc"
import { Alert, Button, Card, Col, Divider, Row, Typography } from "antd";
import RequestCommonRender from "./RequestCommonRender";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import AddressComponent from "../../components/AddressComponent";

const { Text } = Typography;

export default ({
  dAppRequest,
  onComplete,
  onClose
}: {
  dAppRequest: DAppRequest,
  onComplete: () => void,
  onClose: () => void
}) => {

  const activeAccount = useWalletsActiveAccount();
  const { requestId, origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  const { method, params } = dAppRequestParams;

  const approve = () => {
    window.electron.dapp.response(requestId, true, [activeAccount]);
    onClose();
  }
  const reject = () => {
    window.electron.dapp.response(requestId, false, null);
    onClose();
  }

  return <>
    <Row>
      <RequestCommonRender dAppRequest={dAppRequest} />
      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text><br />
        <Card title={"请求账户"} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={24}>
              <Text type="secondary">钱包地址</Text><br />
              <AddressComponent address={activeAccount} />
            </Col>
            <Divider />
            <Col span={24} style={{ marginTop: "10px" }}>
              <Alert type="info" showIcon message={<>
                <Text strong>钱包地址会作为您的身份标识来连接该dApp,该行为没有风险,如果您出于隐私考虑,可以拒绝本次请求,然后切换其他钱包重新登陆该dApp</Text>
              </>} />
            </Col>
          </Row>
        </Card>
      </Col>
      <Divider />
      <Col span={24}>
        <Button style={{ marginTop: "5px", width: "100%" }} onClick={approve} type="primary">连接</Button>
        <Button onClick={reject} color="danger" variant="solid" style={{ width: "100%", marginTop: "5px" }}>拒绝</Button>
      </Col>
    </Row >

  </>

}
