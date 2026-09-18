import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Typography,
  Descriptions,
  Tag,
} from "antd";
import { DAppRequest } from "../../../../main/DappRequestIpc";
import RequestCommonRender from "./RequestCommonRender";
import { ethers, TypedDataDomain } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import AddressComponent from "../../components/AddressComponent";

const { Text } = Typography;

// ==============================
// EIP-712 类型定义
// ==============================
type TypedDataField = { name: string; type: string };
type TypedDataTypes = Record<string, TypedDataField[]>;

type TypedDataPayload = {
  domain?: {
    name?: string;
    version?: string;
    chainId?: number | string;
    verifyingContract?: string;
    salt?: string;
  };
  message?: Record<string, any>;
  primaryType?: string;
  types?: TypedDataTypes;
};

// uint160 最大值（Permit2 常用作"无限授权"）
const UINT160_MAX = ethers.BigNumber.from(2).pow(160).sub(1);
// uint256 最大值
const UINT256_MAX = ethers.BigNumber.from(2).pow(256).sub(1);

// 判断是否为"无限授权"数量
const isUnlimitedAmount = (amount: any): boolean => {
  try {
    const bn = ethers.BigNumber.from(amount);
    return bn.eq(UINT160_MAX) || bn.eq(UINT256_MAX);
  } catch {
    return false;
  }
};

// 短地址显示
const shortAddr = (addr: string) =>
  addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "-";

// 时间戳转日期
const formatTimestamp = (ts: any): string => {
  try {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return String(ts);
    return new Date(n * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
};

export default ({
  dAppRequest,
  onComplete,
  onClose,
}: {
  dAppRequest: DAppRequest;
  onComplete: () => void;
  onClose: () => void;
}) => {
  const activeAccount = useWalletsActiveAccount();
  const { requestId, origin, dAppRequestParams, dAppWalletState } = dAppRequest;
  const { method, params } = dAppRequestParams;

  // params[0]: 签名地址, params[1]: EIP-712 JSON 字符串
  const signWallet: string = params?.[0];
  const typedDataRaw: string = params?.[1];

  const dAppWallet = dAppWalletState.accounts[0];

  // 解析 EIP-712 JSON
  const typedData = useMemo<TypedDataPayload | undefined>(() => {
    if (!typedDataRaw || typeof typedDataRaw !== "string") return undefined;
    try {
      return JSON.parse(typedDataRaw);
    } catch {
      return undefined;
    }
  }, [typedDataRaw]);

  // 可签名条件
  const signable =
    !!typedData &&
    ethers.utils.isAddress(signWallet) &&
    signWallet.toLowerCase() === dAppWallet?.toLowerCase() &&
    activeAccount?.toLowerCase() === signWallet.toLowerCase();

  const signRef = useRef<string | undefined>(undefined);
  const respondedRef = useRef(false);
  const [signing, setSigning] = useState<boolean>(false);
  const [error, setError] = useState<any | undefined>(undefined);

  // 识别 Permit2 无限授权
  const isPermit2Unlimited = useMemo(() => {
    if (!typedData) return false;
    const domainName = typedData.domain?.name;
    const msg = typedData.message;
    const details = msg?.details;

    // Permit2 特征：domain.name === "Permit2"，message.details.amount 为 uint160 max
    if (domainName === "Permit2" && details?.amount) {
      return isUnlimitedAmount(details.amount);
    }
    // 通用：message.amount / message.value 为无限
    if (msg?.amount && isUnlimitedAmount(msg.amount)) return true;
    if (msg?.value && isUnlimitedAmount(msg.value)) return true;
    return false;
  }, [typedData]);

  // 提取用于 UI 展示的关键字段
  const renderMessageFields = () => {
    if (!typedData?.message) return null;

    const msg = typedData.message;
    const rows: JSX.Element[] = [];

    // Permit2 的 message 结构：{ details: { token, amount, expiration, nonce }, spender, sigDeadline }
    if (msg.details && typeof msg.details === "object") {
      const d = msg.details;
      if (d.token) {
        rows.push(
          <Col span={24} key="token">
            <Text type="secondary">代币合约</Text>
            <br />
            {
              d.token && ethers.utils.isAddress(d.token) &&
              <AddressComponent address={d.token} copyable />
            }
          </Col>
        );
      }
      if (d.amount !== undefined) {
        const unlimited = isUnlimitedAmount(d.amount);
        rows.push(
          <Col span={24} key="amount">
            <Text type="secondary">授权数量</Text>
            <br />
            {unlimited ? (
              <Tag color="red">无限授权(uint160 最大值)</Tag>
            ) : (
              <Text strong>{d.amount.toString()}</Text>
            )}
          </Col>
        );
      }
      if (d.expiration !== undefined) {
        rows.push(
          <Col span={24} key="expiration">
            <Text type="secondary">授权过期时间</Text>
            <br />
            <Text>{formatTimestamp(d.expiration)}</Text>
          </Col>
        );
      }
      if (d.nonce !== undefined) {
        rows.push(
          <Col span={24} key="nonce">
            <Text type="secondary">Nonce</Text>
            <br />
            <Text>{d.nonce.toString()}</Text>
          </Col>
        );
      }
    }

    if (msg.spender) {
      rows.push(
        <Col span={24} key="spender">
          <Text type="secondary">被授权方(Spender)</Text>
          <br />
          {
            msg.spender && ethers.utils.isAddress(msg.spender) &&
            <AddressComponent address={msg.spender} copyable />
          }
        </Col>
      );
    }

    if (msg.sigDeadline !== undefined) {
      rows.push(
        <Col span={24} key="sigDeadline">
          <Text type="secondary">签名截止时间</Text>
          <br />
          <Text>{formatTimestamp(msg.sigDeadline)}</Text>
        </Col>
      );
    }

    // 通用字段（非 Permit2）
    if (rows.length === 0) {
      Object.entries(msg).forEach(([k, v]) => {
        rows.push(
          <Col span={24} key={k}>
            <Text type="secondary">{k}</Text>
            <br />
            <Text>{typeof v === "object" ? JSON.stringify(v) : String(v)}</Text>
          </Col>
        );
      });
    }

    return rows;
  };

  // ==============================
  // 签名
  // ==============================
  const sign = async () => {
    if (!signable || !typedData) return;
    setSigning(true);
    setError(undefined);

    try {
      // 构造 domain（只保留 TypedDataDomain 允许的字段）
      const domain: TypedDataDomain = {};
      if (typedData.domain?.name) domain.name = typedData.domain.name;
      if (typedData.domain?.version) domain.version = typedData.domain.version;
      if (typedData.domain?.chainId !== undefined)
        domain.chainId = typedData.domain.chainId;
      if (typedData.domain?.verifyingContract)
        domain.verifyingContract = typedData.domain.verifyingContract;
      if (typedData.domain?.salt) domain.salt = typedData.domain.salt;

      // 移除 types 里的 EIP712Domain（规范要求单独通过 domain 传）
      const rawTypes = typedData.types ?? {};
      const { EIP712Domain, ...cleanTypes } = rawTypes;

      // message
      const message = typedData.message ?? {};

      const signResult = await window.electron.wallet.signTypedData(
        signWallet,
        domain,
        cleanTypes,
        message
      );

      signRef.current = signResult;
      respondedRef.current = true;
      window.electron.dapp.response(requestId, true, signResult);
      onComplete();
    } catch (err: any) {
      console.log(err);
      setError(err);
    } finally {
      setSigning(false);
    }
  };

  const reject = () => {
    respondedRef.current = true;
    window.electron.dapp.response(requestId, false, null, {
      code: 4001,
      message: "User rejected the request.",
    });
    onClose();
  };

  useEffect(() => {
    return () => {
      console.log("** 卸载 EthSignTypedData 组件 **");
      if (!respondedRef.current && !signRef.current) {
        respondedRef.current = true;
        window.electron.dapp.response(requestId, false, null, {
          code: 4001,
          message: "User closed the request without signing",
        });
      }
    };
  }, [requestId]);

  return (
    <Row>
      <RequestCommonRender dAppRequest={dAppRequest} />

      <Col span={24} style={{ marginTop: "10px" }}>
        <Text type="secondary">请求内容</Text>
        <br />
        <Card title={"EIP-712 数据签名"} style={{ marginTop: "5px" }}>
          <Row gutter={[0, 12]}>
            {/* 解析失败 */}
            {!typedData && (
              <Col span={24}>
                <Alert type="error" showIcon message="无法解析 EIP-712 数据" />
              </Col>
            )}

            {/* 解析成功 */}
            {typedData && (
              <>
                {/* Domain 信息 */}
                {typedData.domain && (
                  <>
                    <Col span={24}>
                      <Text strong>Domain</Text>
                    </Col>
                    <Col span={24}>
                      <Descriptions size="small" column={1} bordered>
                        {typedData.domain.name && (
                          <Descriptions.Item label="名称">
                            <Text strong>{typedData.domain.name}</Text>
                          </Descriptions.Item>
                        )}
                        {typedData.domain.version && (
                          <Descriptions.Item label="版本">
                            {typedData.domain.version}
                          </Descriptions.Item>
                        )}
                        {typedData.domain.chainId !== undefined && (
                          <Descriptions.Item label="Chain ID">
                            {typedData.domain.chainId}
                          </Descriptions.Item>
                        )}
                        {typedData.domain.verifyingContract && (
                          <Descriptions.Item label="验证合约">
                            {
                              ethers.utils.isAddress(typedData.domain.verifyingContract) &&
                              <AddressComponent address={typedData.domain.verifyingContract} />
                            }
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Col>
                    <Col span={24}>
                      <Divider style={{ margin: "8px 0" }} />
                    </Col>
                  </>
                )}

                {/* primaryType */}
                {typedData.primaryType && (
                  <Col span={24}>
                    <Text type="secondary">主类型</Text>
                    <br />
                    <Text strong>{typedData.primaryType}</Text>
                  </Col>
                )}

                {/* Message 字段 */}
                <Col span={24}>
                  <Text strong>Message</Text>
                </Col>
                {renderMessageFields()}
              </>
            )}
          </Row>

          <Divider />

          {/* 风险提示 */}
          <Col span={24}>
            {isPermit2Unlimited && (
              <Alert
                style={{ marginBottom: 10 }}
                type="warning"
                showIcon
                message={
                  <>
                    <Text strong>这是「无限授权」请求</Text>
                    <ul>
                      <li>
                        <Text>
                          签名后，被授权方可以随时转走你钱包中<strong>全部</strong>该代币
                        </Text>
                      </li>
                      <li>
                        <Text>
                          该类型签名常用于 Swap 授权交易
                        </Text>
                      </li>
                    </ul>
                    <Text strong>请确认被授权方是可信合约，否则不要签名</Text>
                  </>
                }
              />
            )}

            <Alert
              type="warning"
              showIcon
              message={
                <>
                  <Text strong>
                    签名结果将会被发送到 dApp 页面，请确认数据来源的安全性
                  </Text>
                  <ul>
                    <li>
                      <Text>如果签名内容看起来异常或可疑</Text>
                    </li>
                    <li>
                      <Text>如果是在未知或可疑网站弹出的请求</Text>
                    </li>
                  </ul>
                  <Text strong>请不要签名，并拒绝请求!</Text>
                </>
              }
            />
          </Col>
        </Card>
      </Col>

      <Divider />

      <Col span={24}>
        {/* 错误展示 */}
        {error && (
          <Alert
            style={{ marginBottom: 10 }}
            type="error"
            showIcon
            message={error?.message ?? error?.reason ?? "签名失败"}
          />
        )}

        {/* 未签名 */}
        {!signRef.current && (
          <>
            <Button
              loading={signing}
              style={{ marginTop: "5px", width: "100%" }}
              disabled={!signable || !typedData}
              onClick={sign}
              type="primary"
            >
              签名
            </Button>
            <Button
              disabled={signing}
              onClick={reject}
              color="danger"
              variant="solid"
              style={{ width: "100%", marginTop: "5px" }}
            >
              拒绝
            </Button>
          </>
        )}

        {/* 已签名 */}
        {signRef.current && (
          <>
            <Alert
              type="success"
              message={<Text strong>{signRef.current}</Text>}
            />
            <Button
              onClick={onClose}
              type="dashed"
              style={{ width: "100%", marginTop: "5px" }}
            >
              关闭
            </Button>
          </>
        )}
      </Col>
    </Row>
  );
};
