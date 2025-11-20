import { Alert, Button, Col, Divider, Modal, Row, Typography } from "antd";
import { useState } from "react";
import { AccountRecord } from "../../../../structs/AccountManager";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { RetweetOutlined } from "@ant-design/icons";
import { Contract, ethers } from "ethers";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import EstimateTx from "../../../../utils/EstimateTx";

const { Text } = Typography;

export default ({
  selectedAccountRecord,
  accountManagerContract,
  close,
  setTxHash
}: {
  selectedAccountRecord: AccountRecord,
  accountManagerContract: Contract,
  close: () => void,
  setTxHash: (txHash: string) => void
}) => {

  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const [sending, setSending] = useState<boolean>(false);
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();

  const doWithdraw = async () => {
    if (activeAccount && accountManagerContract && chainId && provider) {
      setSending(true);
      if (selectedAccountRecord) {
        const data = accountManagerContract.interface.encodeFunctionData("withdrawByID", [[selectedAccountRecord.id]]);
        let tx: ethers.providers.TransactionRequest = {
          to: accountManagerContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            setErr(error);
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: accountManagerContract.address }, response, {
              call: {
                from: activeAccount,
                to: accountManagerContract.address,
                input: data,
                value: "0"
              },
              withdrawAmount: ethers.utils.parseEther(selectedAccountRecord.amount.toExact()).toString()
            });
            setTxHash(hash);
          }
        } catch (err: any) {
          setErr(err);
        } finally {
          setSending(false);
        }
      }
    }
  }

  return <>
    {
      render
    }
    <Row>
      {
        selectedAccountRecord?.id == 0 && <Col span={24}>
          <Alert type="info" message={<>
            提现锁仓账户中的<Text strong>挖矿奖励</Text>
          </>} />
        </Col>
      }
      {
        selectedAccountRecord?.id != 0 && <Col span={24}>
          <Alert type="info" message={<>
            提现锁仓账户中已解锁的锁仓记录
            <Text style={{ marginLeft: "5px", float: "right" }} strong>[ID:{selectedAccountRecord?.id}]</Text>
          </>} />
        </Col>
      }
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text strong style={{ fontSize: "32px" }}>
          <RetweetOutlined /> {selectedAccountRecord?.amount.toFixed(6)} SAFE
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">从</Text><br />
        <Text strong style={{ marginLeft: "5px" }}>锁仓账户</Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">到</Text><br />
        <Text strong style={{ marginLeft: "5px" }}>普通账户</Text>
      </Col>
    </Row>
    <Divider />
    <Row>
      <Col span={24} style={{ textAlign: "right" }}>
        {
          !sending && !render && <Button onClick={() => {
            doWithdraw()
          }} disabled={sending} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_broadcast")}
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_sending")}
          </Button>
        }
        {
          render && <Button onClick={close} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_close")}
          </Button>
        }
      </Col>
    </Row>
  </>

}
