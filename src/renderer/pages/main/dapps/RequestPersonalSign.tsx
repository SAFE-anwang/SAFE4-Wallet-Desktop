import { Alert, Button, Card, Col, Divider, Row, Typography } from "antd";
import { DAppRequest } from "../../../../main/DappRequestIpc"
import RequestCommonRender from "./RequestCommonRender";
import { ethers } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useEffect, useRef, useState } from "react";

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
  const messageHex = params[0];
  const signWallet = params[1];
  const dAppWallet = dAppWalletState.accounts[0];
  const message = ethers.utils.isHexString(messageHex) && (ethers.utils.toUtf8String(messageHex));
  const signable = ethers.utils.isHexString(messageHex) && signWallet === dAppWallet && activeAccount === signWallet && activeAccount === activeAccount;
  const signRef = useRef<string | undefined>(undefined);
  const [signing, setSigning] = useState<boolean>(false);

  const sign = async () => {
    if (signable) {
      setSigning(true);
      const signResult = await window.electron.wallet.signMessage(signWallet, messageHex);
      signRef.current = signResult;
      window.electron.dapp.response(requestId, true, signResult);
      setSigning(false);
      onComplete();
    }
  }
  const reject = () => {
    window.electron.dapp.response(requestId, false, undefined);
    onClose();
  }
  useEffect(() => {
    return () => {
      console.log("** 卸载 PersonalSign 组件 **");
      if (!signRef.current) {
        window.electron.dapp.response(requestId, false, undefined);
      }
    }
  }, [requestId]);

  return <>
    <Row>
      <RequestCommonRender dAppRequest={dAppRequest} />
      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text><br />
        <Card title={"数据签名"} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={24}>
              <Text type="secondary">签名数据</Text><br />
              <Text code >{message}</Text>
            </Col>
            <Divider />
            <Col span={24} style={{ marginTop: "10px" }}>
              <Alert type="warning" showIcon message={<>
                <Text strong>签名结果将会被发送到 dApp 页面，请确认数据来源的安全性</Text>
                <ul>
                  <li><Text>如果消息内容看起来异常或可疑</Text></li>
                  <li><Text>如果是在未知或可疑网站弹出的请求</Text></li>
                </ul>
                <Text strong>请不要签名，并拒绝请求!</Text>
              </>} />
            </Col>
          </Row>
        </Card>
      </Col>
      <Divider />
      <Col span={24}>
        {
          !signRef.current && <>
            <Button loading={signing} style={{ marginTop: "5px", width: "100%" }} disabled={!signable} onClick={sign} type="primary">签名</Button>
            <Button disabled={signing} onClick={reject} color="danger" variant="solid" style={{ width: "100%", marginTop: "5px" }}>拒绝</Button>
          </>
        }
        {
          signRef.current && <>
            <Alert type="success" message={<Text strong>
              {signRef.current}
            </Text>} />
            <Button onClick={onClose} type="dashed" style={{ width: "100%", marginTop: "5px" }}>关闭</Button>
          </>
        }
      </Col>
    </Row >

  </>


}
