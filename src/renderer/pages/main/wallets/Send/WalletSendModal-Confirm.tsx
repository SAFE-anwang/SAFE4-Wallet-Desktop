
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import { useTranslation } from "react-i18next";
import AddressComponent from "../../../components/AddressComponent";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../utils/EstimateTx";

const { Text } = Typography;

export default ({
  to, amount, lockDay,
  setTxHash, close
}: {
  to: string,
  amount: string,
  lockDay: number | undefined,
  setTxHash: (txHash: string) => void
  close: () => void,
}) => {

  const { t } = useTranslation();
  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(false);
  const doLockTransfer = useMemo(() => {
    return lockDay && lockDay > 0;
  }, [lockDay])

  const {
    render,
    setTransactionResponse,
    setErr,
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const doSendTransaction = useCallback(async ({ to, amount, lockDay }: { to: string, amount: string, lockDay: number | undefined }) => {
    if (accountManaggerContract && chainId && provider) {
      const value = ethers.utils.parseEther(amount);
      if (lockDay && lockDay > 0) {
        setSending(true);
        const data = accountManaggerContract.interface.encodeFunctionData("deposit", [to, lockDay]);
        const tx: ethers.providers.TransactionRequest = {
          to: accountManaggerContract.address,
          data,
          value,
          chainId
        };
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            setTransactionResponse(response);
            addTransaction({ to: accountManaggerContract.address }, response, {
              call: {
                from: activeAccount,
                to: accountManaggerContract.address,
                input: data,
                value: ethers.utils.parseEther(amount).toString()
              }
            });
            setTxHash(hash);
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      } else {
        setSending(true);
        let tx: ethers.providers.TransactionRequest = {
          to,
          value,
          chainId,
        }
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        );
        if (signedTx) {
          try {
            const response = await provider.sendTransaction(signedTx);
            const { hash } = response;
            setTxHash(hash);
            setTransactionResponse(response);
            addTransaction(tx, response, {
              transfer: {
                from: activeAccount,
                to: tx.to,
                value: tx.value.toString()
              }
            });
          } catch (err) {
            setErr(err)
          } finally {
            setSending(false);
          }
        }
        if (error) {
          setSending(false);
          setErr(error)
        }
      }
    }
  }, [accountManaggerContract, activeAccount]);

  return (<>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{amount} SAFE</Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_from")}</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressComponent style={{ fontSize: "16px" }} address={activeAccount} copyable qrcode />
          </Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_to")}</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressComponent style={{ fontSize: "16px" }} address={to} copyable qrcode />
          </Text>
        </Col>
      </Row>
      <br />
      {
        doLockTransfer &&
        <Row >
          <Col span={24}>
            <Text strong>{t("wallet_lock_lockday")}</Text>
            <br />
            <Text style={{ fontSize: "18px" }}>
              {lockDay}
            </Text>
          </Col>
        </Row>
      }
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction({ to, amount, lockDay });
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
    </div>
  </>)

}
