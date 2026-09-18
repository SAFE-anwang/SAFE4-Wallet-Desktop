import { Alert, Button, Card, Col, Divider, Row, Typography } from "antd"
import { useEffect, useMemo, useRef, useState } from "react";
import AddressComponent from "../../components/AddressComponent";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../utils/EstimateTx";
import RequestCommonRender from "./RequestCommonRender";
import TextArea from "antd/es/input/TextArea";
import { DAppRequest } from "../../../../main/DappRequestIpc";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useDAppBlockchainRpcProps } from "../../../state/dApp/hooks";

const { Text, Link } = Typography;

export default ({
  dAppRequest,
  onComplete,
  onClose
}: {
  dAppRequest: DAppRequest,
  onComplete: () => void,
  onClose: () => void
}) => {

  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<any | undefined>(undefined);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
  const hashRef = useRef<string | undefined>(undefined);
  const dAppBlockchainRpcProps = useDAppBlockchainRpcProps();

  const { requestId, origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  useEffect(() => {
    return () => {
      console.log("** 卸载 EthSendTransaction 组件 **");
      if (hashRef.current == undefined) {
        window.electron.dapp.response(requestId, false, null);
      }
    }
  }, [requestId]);

  const dAppChainId = dAppWalletState.chainId;
  const { method, params } = dAppRequestParams;
  const {
    from,
    gas,
    to,
    data,
    value
  } = params[0];

  const isActiveAccountWallet = activeAccount == dAppWalletState.accounts[0];
  const dAppProvider = useMemo(() => {
    return chainId === Number(dAppChainId) && provider ? provider
      : new ethers.providers.JsonRpcProvider(dAppBlockchainRpcProps[Number(dAppChainId)]?.rpcUrls[0]);;
  }, [dAppChainId, chainId, provider]);

  const approve = async () => {
    if (dAppProvider && dAppChainId) {
      setSending(true);
      try {
        console.log("[RequestEthSendTransaction] build Txn @ Provider:", dAppProvider.connection.url);
        let tx: ethers.providers.TransactionRequest = {
          to,
          value,
          data,
          chainId: Number(dAppChainId),
        }
        tx = await EstimateTx(from, Number(dAppChainId), tx, dAppProvider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          from,
          tx
        );
        if (signedTx) {
          const response = await dAppProvider.sendTransaction(signedTx);
          const { hash, data } = response;
          hashRef.current = hash;
          window.electron.dapp.response(requestId, true, hash);
          onComplete();
        } else {
          setError(error);
        }
      } catch (err: any) {
        console.log(err.error);
        setError(err);
      } finally {
        setSending(false);
      }
    }
  }

  const reject = () => {
    window.electron.dapp.response(requestId, false, null);
    onClose();
  }

  const value_weiBN = ethers.BigNumber.from(value);
  const value_ether = ethers.utils.formatEther(value_weiBN);

  const renderrror = () => {
    if (error) {
      return <>
        <Alert type="error" showIcon
          description={<>
            {
              error.code && <>
                <Text type="danger" strong>{error.code}</Text><br />
              </>
            }
            {
              error.reason && <>
                <Text type="danger">{error.reason}</Text><br />
              </>
            }
            {
              !showErrorDetails && <Link onClick={() => setShowErrorDetails(true)}>点击查看错误详情</Link>
            }
            {
              showErrorDetails && <>
                <Divider />
                <Text type="danger">{JSON.stringify(error)}</Text>
              </>
            }
          </>} />
      </>
    }
    return <></>
  }

  return <>
    <Row>
      <RequestCommonRender dAppRequest={dAppRequest} />
      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text><br />
        <Card title={"发送交易"} style={{ marginTop: "5px" }}>
          <Row>
            <Col span={24}>
              <Text type="secondary">从</Text><br />
              {
                ethers.utils.isAddress(from) && <AddressComponent address={from} />
              }
              {
                !ethers.utils.isAddress(from) && <Text strong type="danger">{from}</Text>
              }
            </Col>
            <Col span={24}>
              <Text type="secondary">到</Text><br />
              {
                ethers.utils.isAddress(to) && <AddressComponent address={to} />
              }
              {
                !ethers.utils.isAddress(to) && <Text strong type="danger">{to}</Text>
              }
            </Col>
            <Col span={24}>
              <Text type="secondary">数量</Text><br />
              <Text strong>
                {
                  value_ether
                }
              </Text>
              <Text strong style={{ marginLeft: "5px" }}>
                {dAppBlockchainRpcProps[Number(dAppChainId)].nativeCurrency?.symbol}
              </Text>
            </Col>
            {
              data &&
              <Col span={24}>
                <Text type="secondary">Data</Text><br />
                <TextArea disabled value={data} />
              </Col>
            }
            <Divider />
            <Col span={24} style={{ marginTop: "10px" }}>
              <Alert type="warning" showIcon message={<>
                <Text strong>交易将会广播到区块链网络，请确认交易请求的安全性</Text>
                <ul>
                  <li><Text>如果交易内容看起来异常或可疑</Text></li>
                  <li><Text>如果是在未知或可疑网站弹出的请求</Text></li>
                </ul>
                <Text strong>请不要发送，并拒绝请求!</Text>
              </>} />
            </Col>
          </Row>
        </Card>
      </Col>

      <Divider />
      {
        !hashRef.current && !error && <>
          <Col span={24}>
            <Button disabled={!isActiveAccountWallet} loading={sending} onClick={approve} type="primary" style={{ width: "100%" }}>发送</Button>
          </Col>
          <Col span={24} style={{ marginTop: "10px" }}>
            <Button disabled={sending} onClick={reject} color="danger" variant="solid" style={{ width: "100%" }}>拒绝</Button>
          </Col>
        </>
      }
      {
        hashRef.current && !error && <>
          <Col span={24}>
            <Alert style={{ marginTop: "5px" }} showIcon type="success" message={hashRef.current} />
          </Col>
          <Col span={24} style={{ marginTop: "10px" }}>
            <Button onClick={onClose} type="dashed" style={{ width: "100%" }}>关闭</Button>
          </Col>
        </>
      }
      {
        !hashRef.current && error && <>
          <Col span={24}>
            {
              renderrror()
            }
          </Col>
          <Col span={24} style={{ marginTop: "10px" }}>
            <Button onClick={onClose} type="dashed" style={{ width: "100%" }}>关闭</Button>
          </Col>
        </>
      }

    </Row >
  </>

}
