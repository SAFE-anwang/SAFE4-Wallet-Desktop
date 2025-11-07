
import { Button, Col, Divider, Row, Typography } from "antd"
import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from '@ant-design/icons';
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";
import { useIERC20Contract } from "../../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";
import AddressView from "../../../../components/AddressView";
import { Token, TokenAmount } from "@uniswap/sdk";
import { useTranslation } from "react-i18next";
import AddressComponent from "../../../../components/AddressComponent";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../../utils/EstimateTx";

const { Text } = Typography;

export default ({
  token,
  to, amount,
  setTxHash, close
}: {
  token: Token,
  to: string,
  amount: string,
  setTxHash: (txHash: string) => void
  close: () => void,
}) => {

  const { t } = useTranslation();
  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const IERC20Contract = useIERC20Contract(token.address, true);
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);

  const doSendTransaction = useCallback(async ({ to, amount }: { to: string, amount: string }) => {
    if (provider && chainId && IERC20Contract) {
      const { address, name, symbol, decimals } = token;
      const transferAmount = ethers.utils.parseUnits(amount, decimals);
      setSending(true);
      let data = IERC20Contract.interface.encodeFunctionData("transfer", [
        to, transferAmount
      ]);
      data = data + "00112233";
      let tx: ethers.providers.TransactionRequest = {
        to: IERC20Contract.address,
        data,
        chainId,
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );
      console.log("Sign Transaction:", signedTx)
      console.log("Sign Error:", error)
      if (error) {
        setErr(error);
      }
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setTxHash(hash);
          setTransactionResponse(response);
          addTransaction({ to: token.address }, response, {
            call: {
              from: activeAccount,
              to: address,
              input: data,
              value: "0",
              tokenTransfer: {
                from: activeAccount,
                to,
                value: transferAmount.toString(),
                token: {
                  address,
                  name: name ?? "",
                  symbol: symbol ?? "",
                  decimals
                }
              }
            }
          });
        } catch (err: any) {
          setErr(err)
        }
      }
      setSending(false);
    }
  }, [provider, IERC20Contract]);

  return (<>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{amount} {token.symbol}</Text>
        </Col>
      </Row>
      <br />

      <Row >
        <Col span={24}>
          <Text type="secondary">{t("wallet_tokens_contract")}</Text>
          <br />
          <AddressComponent style={{ fontSize: "16px" }} address={token.address} qrcode copyable />
        </Col>
      </Row>
      <Divider />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_from")}</Text>
          <br />
          <AddressComponent style={{ fontSize: "16px" }} address={activeAccount} qrcode copyable />
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_to")}</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressComponent style={{ fontSize: "16px" }} address={to} qrcode copyable />
          </Text>
        </Col>
      </Row>
      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doSendTransaction({ to, amount });
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
