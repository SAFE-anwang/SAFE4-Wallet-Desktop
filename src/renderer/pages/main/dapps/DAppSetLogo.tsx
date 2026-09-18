import { Alert, Avatar, Button, Col, Divider, Modal, Row, Spin, Typography } from "antd";
import { ArrowRightOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { CurrencyAmount } from "@uniswap/sdk";
import { useTranslation } from "react-i18next";

import { useDAppManagerContract } from "../../../hooks/useContracts";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import EstimateTx from "../../../utils/EstimateTx";
import { DAppInfo } from "../../../structs/DApp";

const { Text } = Typography;

const MAX_LOGO_SIZE = 128 * 1024;

function formatSizeUnits(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export default function DAppSetLogo({
  dAppInfo,
  onClose,
}: {
  dAppInfo: DAppInfo;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const dAppManagerContract = useDAppManagerContract();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountBalance = useETHBalances([activeAccount])[activeAccount];
  const addTransaction = useTransactionAdder();

  const {
    render,
    setTransactionResponse,
    setErr,
  } = useTransactionResponseRender();

  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [err, setErrLocal] = useState<any>();

  // 链上已存的 LOGO（hex 字符串）
  const [logo, setLogo] = useState<string>();
  const [loading, setLoading] = useState(false);

  // 用户选择的 LOGO
  const [LOGO, setLOGO] = useState<{ path: string; hex: string }>();

  // 需要支付的费用
  const [logoPayAmount, setLogoPayAmount] = useState<CurrencyAmount>();

  const cancel = () => {
    onClose();
  };

  // 拉取费用 + 链上已存 LOGO
  useEffect(() => {
    if (!dAppManagerContract) return;
    setLoading(true);

    dAppManagerContract.callStatic
      .getLogoPayAmount()
      .then((data: any) => {
        setLogoPayAmount(CurrencyAmount.ether(data));
      })
      .catch(() => { });

    dAppManagerContract.callStatic
      .getLogo(dAppInfo.id)
      .then((data: string) => {
        setLogo(data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [dAppManagerContract, dAppInfo.id]);

  const selectLOGOPicture = async () => {
    const result = await window.electron.fileReader.selectFile();
    if (result) {
      const [path, hex] = result;
      setLOGO({ path, hex });
    }
  };

  const LOGO_SIZE_GREATER_THAN_MAX = useMemo(() => {
    if (LOGO) {
      return LOGO.hex.length / 2 > MAX_LOGO_SIZE;
    }
    return false;
  }, [LOGO]);

  const couldSetLogo = useMemo(() => {
    if (LOGO && !LOGO_SIZE_GREATER_THAN_MAX) {
      return logoPayAmount && activeAccountBalance
        ? activeAccountBalance.greaterThan(logoPayAmount)
        : false;
    }
    return false;
  }, [LOGO, activeAccountBalance, logoPayAmount, LOGO_SIZE_GREATER_THAN_MAX]);

  const doSetLogo = async () => {
    if (!dAppManagerContract || !LOGO || !logoPayAmount || !chainId || !provider) return;

    setSending(true);
    setErrLocal(undefined);
    setTxHash(undefined);

    const logoPayAmountRaw = ethers.BigNumber.from(logoPayAmount.raw.toString());

    // 合约: setLogo(uint256 id, bytes memory logo)
    const data = dAppManagerContract.interface.encodeFunctionData("setLogo", [
      dAppInfo.id,
      LOGO.hex,
    ]);

    let tx: ethers.providers.TransactionRequest = {
      to: dAppManagerContract.address,
      data,
      chainId,
      value: logoPayAmountRaw,
    };

    try {
      tx = await EstimateTx(activeAccount, chainId, tx, provider);

      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );

      if (error) {
        setErrLocal(error);
        setErr(error);
        return;
      }

      if (signedTx) {
        const response = await provider.sendTransaction(signedTx);
        const { hash, data: responseData } = response;

        addTransaction({ to: dAppManagerContract.address }, response, {
          call: {
            from: activeAccount,
            to: dAppManagerContract.address,
            input: responseData,
            value: logoPayAmountRaw.toString(),
          },
        });

        setTransactionResponse(response);
        setTxHash(hash);
      }
    } catch (e: any) {
      setErrLocal(e);
      setErr(e);
    } finally {
      setSending(false);
    }
  };

  return (


    <div>
      <Spin spinning={loading}>
        <Divider />
        <Row>
          <Col span={12}>
            <Text type="secondary">应用名称</Text>
            <br />
            <Text strong>{dAppInfo.name}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">关键词</Text>
            <br />
            <Text strong>{dAppInfo.keyword || "-"}</Text>
          </Col>
        </Row>
      </Spin>

      <Divider />

      <Row>
        <Col span={24} style={{ marginTop: 20 }}>
          <Text type="secondary">应用 LOGO</Text>
        </Col>

        <Col span={24} style={{ marginTop: 20 }}>
          {/* 链上已存 LOGO：用 hex 或占位 */}
          {logo && logo !== "0x" && (
            <Avatar
              src={`data:image/png;base64,${hexToBase64(logo)}`}
              style={{ width: 48, height: 48 }}
            />
          )}
          {LOGO && (
            <>
              <ArrowRightOutlined style={{ marginLeft: 10, marginRight: 10 }} />
              <Avatar src={`file://${LOGO.path}`} style={{ width: 48, height: 48 }} />
            </>
          )}
        </Col>

        <Col span={24} style={{ marginTop: 30 }}>
          {LOGO_SIZE_GREATER_THAN_MAX && (
            <Alert
              style={{ marginBottom: 10 }}
              type="error"
              showIcon
              message={`超过图片大小限制,请选择低于 ${formatSizeUnits(MAX_LOGO_SIZE)} 大小的图片作为 LOGO`}
            />
          )}
          <Button disabled={!!txHash || !!err} onClick={selectLOGOPicture}>
            选择图片
          </Button>
        </Col>
      </Row>

      <Divider />

      <Row>
        <Col span={24} style={{ marginBottom: 20 }}>
          <Alert
            type="info"
            message={`上传 LOGO 需要支付 ${logoPayAmount?.toSignificant() ?? "-"} SAFE`}
          />
        </Col>

        <Col span={24}>
          {txHash && (
            <Alert
              style={{ marginBottom: 10 }}
              showIcon
              type="success"
              message={txHash}
            />
          )}
          {err && (
            <Alert
              style={{ marginBottom: 10 }}
              showIcon
              type="error"
              message={err.error?.reason ?? err.error?.toString() ?? String(err)}
            />
          )}

          {!sending && !render && (
            <Button
              icon={<SendOutlined />}
              onClick={doSetLogo}
              type="primary"
              disabled={!couldSetLogo}
            >
              发送
            </Button>
          )}
          {sending && !render && (
            <Button loading disabled type="primary">
              发送中...
            </Button>
          )}
          {render && <Button onClick={cancel}>关闭</Button>}
        </Col>
      </Row>
    </div>
  );
}

// 把 0x 开头的 hex 转成 base64（用于 data:image/png;base64,）
function hexToBase64(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
