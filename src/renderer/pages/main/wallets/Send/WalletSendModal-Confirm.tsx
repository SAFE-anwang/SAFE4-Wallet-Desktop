
import { Button, Col, Divider, Row, Typography, Alert } from "antd"
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { LockOutlined, SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount, useWalletsActiveSigner } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import AddressView from "../../../components/AddressView";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useAccountManagerContract } from "../../../../hooks/useContracts";
import { useTranslation } from "react-i18next";
import AddressComponent from "../../../components/AddressComponent";
import { useWeb3React } from "@web3-react/core";

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
  const signer = useWalletsActiveSigner();
  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const accountManaggerContract = useAccountManagerContract(true);
  const doLockTransfer = useMemo(() => {
    return lockDay && lockDay > 0;
  }, [lockDay])

  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const doSendTransaction = useCallback(({ to, amount, lockDay }: { to: string, amount: string, lockDay: number | undefined }) => {
    if (signer && accountManaggerContract && chainId && provider) {
      const value = ethers.utils.parseEther(amount);
      if (lockDay && lockDay > 0) {
        setSending(true);
        accountManaggerContract.deposit(to, lockDay, {
          value: ethers.utils.parseEther(amount),
        }).then((response: any) => {
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
          setSending(false);
        }).catch((err: any) => {
          setSending(false);
          setErr(err)
        })
      } else {
        const tx = {
          to,
          value,
          chainId
        }
        setSending(true);
        window.electron.wallet.signTransaction(
          activeAccount,
          provider.connection.url,
          tx
        ).then(signedTx => {
          provider.sendTransaction(signedTx).then(response => {
            setSending(false);
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
          }).catch(err => {
            setSending(false);
            setErr(err)
          })
        })
      }
    }
  }, [signer, accountManaggerContract]);

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
