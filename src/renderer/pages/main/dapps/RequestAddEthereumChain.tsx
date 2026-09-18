import { Alert, Button, Card, Col, Divider, Row, Typography, Space } from "antd";
import { DAppRequest } from "../../../../main/DappRequestIpc";
import RequestCommonRender from "./RequestCommonRender";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useMemo } from "react";
import { BlockchainRpcProp } from "../../../state/dApp/reducer";
import { useDispatch } from "react-redux";
import { upsertDAppRpc } from "../../../state/dApp/actions";

const { Text, Link } = Typography;

// ---------- 校验工具 ----------

// chainId 必须是 0x 开头的 hex string
const isHexChainId = (v: any) =>
  typeof v === "string" && /^0x[0-9a-fA-F]+$/.test(v);

const hexToChainId = (hex: string): number => parseInt(hex, 16);

// rpcUrls 必填，长度 >= 1，每项必须是 http(s):// 或 wss://
const isValidRpcUrls = (v: any): v is string[] =>
  Array.isArray(v) &&
  v.length >= 1 &&
  v.every((u: any) => typeof u === "string" && /^(https?|wss?):\/\/.+/i.test(u));

// blockExplorerUrls 可选；若存在，则每项必须 http(s)://
const isValidBlockExplorerUrls = (v: any) =>
  v === undefined ||
  (Array.isArray(v) &&
    v.length > 0 &&
    v.every((u: any) => typeof u === "string" && /^https?:\/\/.+/i.test(u)));

// nativeCurrency 必填，且 decimals 必须为 18
const isValidNativeCurrency = (v: any) =>
  v &&
  typeof v === "object" &&
  typeof v.name === "string" &&
  v.name.length > 0 &&
  typeof v.symbol === "string" &&
  v.symbol.length > 0 &&
  typeof v.decimals === "number" &&
  v.decimals === 18;

// chainName 必填，非空字符串
const isValidChainName = (v: any) =>
  typeof v === "string" && v.length > 0;

// ---------- 组件 ----------

export default ({
  dAppRequest,
  onComplete,
  onClose
}: {
  dAppRequest: DAppRequest;
  onComplete: () => void;
  onClose: () => void;
}) => {
  const activeAccount = useWalletsActiveAccount();
  const { requestId, origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  const { method, params } = dAppRequestParams;
  const dispatch = useDispatch();

  const blockchainRpcProp = useMemo<BlockchainRpcProp | undefined>(() => {
    // 必须是数组，且长度为 1
    if (!Array.isArray(params) || params.length !== 1) return undefined;

    const prop = params[0];
    if (!prop || typeof prop !== "object") return undefined;

    // ---- 必填字段 ----
    // chainId：hex string
    if (!isHexChainId(prop.chainId)) return undefined;
    const chainIdNum = hexToChainId(prop.chainId);
    if (!Number.isInteger(chainIdNum) || chainIdNum <= 0) return undefined;

    // rpcUrls：必填，长度 >= 1
    if (!isValidRpcUrls(prop.rpcUrls)) return undefined;

    // nativeCurrency：必填，decimals === 18
    if (!isValidNativeCurrency(prop.nativeCurrency)) return undefined;

    // chainName：必填，非空字符串
    if (!isValidChainName(prop.chainName)) return undefined;

    // ---- 可选字段 ----
    if (!isValidBlockExplorerUrls(prop.blockExplorerUrls)) return undefined;

    // ---- 规范化返回 ----
    const result: BlockchainRpcProp = {
      chainId: chainIdNum,
      rpcUrls: prop.rpcUrls,
      nativeCurrency: prop.nativeCurrency,
      chainName: prop.chainName,
    };
    if (prop.blockExplorerUrls) result.blockExplorerUrls = prop.blockExplorerUrls;

    return result;
  }, [params]);

  const approve = () => {
    if (blockchainRpcProp) {
      dispatch(upsertDAppRpc(blockchainRpcProp));
      window.electron.dapp.response(requestId, true, {
        chainId: blockchainRpcProp.chainId,
        rpc: blockchainRpcProp.rpcUrls[0]
      });
      onClose();
    }
  };

  const reject = () => {
    window.electron.dapp.response(requestId, false, null);
    onClose();
  };

  return (
    <>
      <Row>
        <RequestCommonRender dAppRequest={dAppRequest} />

        <Col span={24} style={{ marginTop: "10px" }}>
          <Text type="secondary">请求内容</Text>
          <br />
          <Card title={"添加区块链网络"} style={{ marginTop: "5px" }}>
            <Row>
              <Divider />
              {/* 校验失败 */}
              {!blockchainRpcProp && (
                <Col span={24} style={{ marginTop: "10px" }}>
                  <Alert
                    type="error"
                    showIcon
                    message="网络参数格式不正确，无法解析"
                  />
                </Col>
              )}
              {/* 校验通过 */}
              {blockchainRpcProp && (
                <>
                  <Col span={12} style={{ marginTop: "10px" }}>
                    <Text type="secondary">链 ID</Text>
                    <br />
                    <Text strong>
                      {blockchainRpcProp.chainId}
                      <Text type="secondary" style={{ marginLeft: 6 }}>
                        (0x{blockchainRpcProp.chainId.toString(16)})
                      </Text>
                    </Text>
                  </Col>

                  <Col span={12} style={{ marginTop: "10px" }}>
                    <Text type="secondary">链名称</Text>
                    <br />
                    <Text strong>{blockchainRpcProp.chainName}</Text>
                  </Col>

                  {/* 只展示第一个 RPC 地址 */}
                  <Col span={24} style={{ marginTop: "10px" }}>
                    <Text type="secondary">RPC 节点</Text>
                    <br />
                    <Link
                      href={blockchainRpcProp.rpcUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {blockchainRpcProp.rpcUrls[0]}
                    </Link>
                    {blockchainRpcProp.rpcUrls.length > 1 && (
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        （共 {blockchainRpcProp.rpcUrls.length} 个）
                      </Text>
                    )}
                  </Col>

                  {/* 只展示第一个区块浏览器 */}
                  {blockchainRpcProp.blockExplorerUrls &&
                    blockchainRpcProp.blockExplorerUrls.length > 0 && (
                      <Col span={24} style={{ marginTop: "10px" }}>
                        <Text type="secondary">区块浏览器</Text>
                        <br />
                        <Link
                          href={blockchainRpcProp.blockExplorerUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {blockchainRpcProp.blockExplorerUrls[0]}
                        </Link>
                      </Col>
                    )}

                  {/* 原生币 */}
                  <Col span={8} style={{ marginTop: "10px" }}>
                    <Text type="secondary">原生币名称</Text>
                    <br />
                    <Text strong>{blockchainRpcProp.nativeCurrency?.name}</Text>
                  </Col>
                  <Col span={8} style={{ marginTop: "10px" }}>
                    <Text type="secondary">符号</Text>
                    <br />
                    <Text strong>{blockchainRpcProp.nativeCurrency?.symbol}</Text>
                  </Col>
                  <Col span={8} style={{ marginTop: "10px" }}>
                    <Text type="secondary">精度</Text>
                    <br />
                    <Text strong>{blockchainRpcProp.nativeCurrency?.decimals}</Text>
                  </Col>

                  <Col span={24} style={{ marginTop: "20px" }}>
                    <Alert
                      type="warning"
                      showIcon
                      message="请确认以上网络信息来自可信来源。添加后，DApp 可通过该 RPC 节点与网络交互。"
                    />
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>

        <Divider />

        <Col span={24} style={{ textAlign: "right" }}>
          <Button disabled={!blockchainRpcProp} style={{ marginTop: "5px", width: "100%" }} onClick={approve} type="primary">添加</Button>
          <Button onClick={reject} color="danger" variant="solid" style={{ width: "100%", marginTop: "5px" }}>拒绝</Button>
        </Col>
      </Row>
    </>
  );
};
