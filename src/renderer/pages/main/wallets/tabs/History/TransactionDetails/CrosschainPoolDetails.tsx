import { Card, Col, Row, Typography } from "antd"
import { TransactionDetails } from "../../../../../../state/transactions/reducer"
import TokenLogo from "../../../../../components/TokenLogo";
import { useWalletsActiveAccount } from "../../../../../../state/wallets/hooks";
import AddressView from "../../../../../components/AddressView";
import AddressComponent from "../../../../../components/AddressComponent";

const { Text } = Typography;

export default ({
  support, transaction
}: {
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
  transaction: TransactionDetails
}) => {

  const {
    call,
    hash
  } = transaction;
  const activeAccount = useWalletsActiveAccount();

  return <>
    <Row>
      <Text type="secondary">跨链</Text>
    </Row>
    <Card>
      {/* <Text>{JSON.stringify(support)}</Text> */}
      <Row style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Text type="secondary">跨链发起</Text>
        </Col>
        <Col>
          <Text>0x362123d965941cca4456fd403b0e1d18d9dbfa56859d36c8c247d59b768391ea</Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">从</Text>
        </Col>
        <Col span={2} style={{ paddingTop: "8px" }}>
          <TokenLogo width="30px" height="30px" />
        </Col>
        <Col span={22}>
          <Text strong>Safe4 网络</Text>
          <br />
          <AddressComponent address={activeAccount} />
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Text type="secondary">跨链到</Text>
        </Col>
        <Col span={2} style={{ paddingTop: "8px" }}>
          <TokenLogo width="30px" height="30px" />
        </Col>
        <Col span={22}>
          <Text strong>Safe4 网络</Text>
          <br />
          <AddressComponent address={activeAccount} />
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Text type="secondary">跨链确认</Text>
        </Col>
        <Col>
          <Text>0x362123d965941cca4456fd403b0e1d18d9dbfa56859d36c8c247d59b768391ea</Text>
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Text type="secondary">跨链状态</Text>
        </Col>
        <Col>
          <Text strong type="success">已完成</Text>
        </Col>
      </Row>
    </Card>
  </>
}
