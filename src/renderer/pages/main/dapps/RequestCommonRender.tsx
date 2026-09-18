import { Alert, Col, Divider, Row, Typography } from "antd"
import { useState } from "react"
import BlockchainNetwork from "../../components/BlockchainNetwork"
import { useWeb3React } from "@web3-react/core"
import { DAppRequest } from "../../../../main/DappRequestIpc"

const { Text, Link } = Typography

export default ({
  dAppRequest
}: {
  dAppRequest: DAppRequest
}) => {

  const { chainId } = useWeb3React();
  const { origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  const [showReqRaw, setShowReqRaw] = useState<boolean>(false);

  return <>
    <Col span={24}>
      <Text style={{ float: "left" }} type="secondary">来源:</Text>
      <Text style={{ float: "right" }} strong>{origin}</Text><br />
    </Col>

    <Col span={24} style={{ marginTop: "10px" }}>
      <Row>
        <Col span={24}>
          <Text style={{ float: "left" }} type="secondary">dApp 正在使用的区块链网络</Text>
          <div style={{ float: "right" }}>
            <BlockchainNetwork size="small" chainId={dAppWalletState.chainId} />
          </div>
        </Col>
        {
          chainId && chainId != Number(dAppWalletState.chainId) && <>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Alert style={{ width: "100%" }} type="warning" showIcon description={"您正在使用与当前钱包不一致的区块链网络"} />
            </Col>
          </>
        }
      </Row>
    </Col>

    <Divider />
    <Col span={24}>
      {
        showReqRaw && <>
          <Text type="secondary">原始数据</Text><br />
          <Text>{JSON.stringify(dAppRequestParams)}</Text>
        </>
      }
      {
        !showReqRaw && <>
          <Link onClick={() => setShowReqRaw(true)}>查看原始数据</Link>
        </>
      }
    </Col>
    <Divider />
  </>

}
