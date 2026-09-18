import { Alert, Button, Col, Divider, Modal, Row, Space, Typography, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import { ethers } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useDAppManagerContract } from "../../../hooks/useContracts";
import EstimateTx from "../../../utils/EstimateTx";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { DAppInfo } from "../../../structs/DApp";

const { Text, Title, Link } = Typography;

export default function DAppRemove({
  dAppInfo,
  onClose,
}: {
  dAppInfo: DAppInfo;
  onClose: () => void;
}) {

  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const dAppManagerContract = useDAppManagerContract();
  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
  } = useTransactionResponseRender();

  const [sending, setSending] = useState<boolean>(false);

  const handleRemove = async () => {
    if (!activeAccount) {
      message.error("请先连接钱包");
      return;
    }
    if (!dAppManagerContract || !chainId || !provider) {
      message.error("合约或网络未就绪");
      return;
    }

    setSending(true);
    try {
      const data = dAppManagerContract.interface.encodeFunctionData("remove", [
        dAppInfo.id
      ]);

      let tx: ethers.providers.TransactionRequest = {
        to: dAppManagerContract.address,
        data,
        value: ethers.utils.parseEther("0"),
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);

      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );

      if (error) {
        setErr(error);
        return;
      }

      if (signedTx) {
        const response = await provider.sendTransaction(signedTx);
        const { data: responseData } = response;
        setTransactionResponse(response);
        addTransaction({ to: dAppManagerContract.address }, response, {
          call: {
            from: activeAccount,
            to: dAppManagerContract.address,
            input: responseData,
            value: ethers.utils.parseEther("0").toString()
          }
        });
      }
    } catch (err) {
      setErr(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Divider />

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Alert
          showIcon
          type="warning"
          icon={<ExclamationCircleOutlined />}
          message="您正在操作将应用信息从合约中移除"
          description={
            <>
              <Row>
                <Col span={12}>
                  <Text type="secondary">应用名称</Text>
                  <br />
                  <Text strong>{dAppInfo.name}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">访问链接</Text>
                  <br />
                  <Link>{dAppInfo.runUrl}</Link>
                </Col>
                <Col span={24} style={{ marginTop: "10px" }}>
                  <Text type="secondary">{dAppInfo.description}</Text>
                </Col>
              </Row>
            </>
          }
        />
        <Divider />
        {
          render
        }
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onClose} disabled={sending}>
              取消
            </Button>
            {!render && (
              <Button
                danger
                type="primary"
                loading={sending}
                disabled={sending}
                onClick={handleRemove}
              >
                确认删除
              </Button>
            )}
            {render && (
              <Button type="primary" onClick={onClose}>
                关闭
              </Button>
            )}
          </Space>
        </div>

      </Space>
    </>
  );
}
