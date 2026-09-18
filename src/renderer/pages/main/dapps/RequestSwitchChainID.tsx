import { Button, Card, Col, Divider, Row, Typography } from "antd"
import { DAppRequest } from "../../../../main/DappRequestIpc";
import { useEffect, useRef, useState } from "react";
import BlockchainNetwork from "../../components/BlockchainNetwork";
import { ArrowRightOutlined } from "@ant-design/icons";
import RequestCommonRender from "./RequestCommonRender";
import { Default_BlockchainRpcProps } from "./BlockchainChainID_RPC";
import { useDAppBlockchainRpcProps } from "../../../state/dApp/hooks";

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
  const { requestId, origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  const { method, params } = dAppRequestParams;
  const targetChainId = Number(params[0].chainId);
  const isSupportChainId = Default_BlockchainRpcProps[targetChainId] !== undefined;
  const result = useRef<boolean>(false);
  const dAppBlockchainRpcProps = useDAppBlockchainRpcProps();

  const approve = () => {
    result.current = true;
    window.electron.dapp.response(requestId, true, {
      chainId: targetChainId,
      rpc: dAppBlockchainRpcProps[targetChainId].rpcUrls[0]
    });
    onClose();
  }
  const reject = () => {
    result.current = false;
    window.electron.dapp.response(requestId, false, null);
    onClose();
  }

  useEffect(() => {
    return () => {
      console.log("** 卸载 SwitchChainID 组件 **")
      if (!result.current) {
        window.electron.dapp.response(requestId, false, null);
      }
      onClose();
    }
  }, [requestId]);

  return <>
    <Row>
      {
        <RequestCommonRender dAppRequest={dAppRequest} />
      }
      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text><br />

        <Card title={"切换 dApp 正在使用的区块链网络"} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={10}>
              <BlockchainNetwork chainId={dAppWalletState.chainId} />
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              <ArrowRightOutlined style={{ fontSize: "40px", marginTop: "24px" }} />
            </Col>
            <Col span={10}>
              <BlockchainNetwork chainId={targetChainId} />
            </Col>
          </Row>
        </Card>
      </Col>
      <Divider />
      <Col span={24}>
        <Button disabled={!isSupportChainId} onClick={approve} type="primary" style={{ width: "100%" }}>切换</Button>
      </Col>
      <Col span={24} style={{ marginTop: "10px" }}>
        <Button onClick={reject} color="danger" variant="solid" style={{ width: "100%" }}>拒绝</Button>
      </Col>
    </Row>
  </>


}
