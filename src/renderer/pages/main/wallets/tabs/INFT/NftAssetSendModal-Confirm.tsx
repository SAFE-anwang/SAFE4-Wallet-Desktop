import { useCallback, useState } from "react";
import { NftAssetVO, NftTokenVO } from "../../../../../services/insight"
import { useTranslation } from "react-i18next";
import { Alert, Button, Col, Divider, Input, Row, Space, Typography } from "antd";
import AddressComponent from "../../../../components/AddressComponent";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import NFTTokenLogoComponent from "../../../../components/NFTTokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import NftAsset from "./NftAsset";
import { useTransactionAdder } from "../../../../../state/transactions/hooks";
import { useINFT1155Contract, useINFT721Contract } from "../../../../../hooks/useContracts";
import useTransactionResponseRender from "../../../../components/useTransactionResponseRender";
import { BigNumber, ethers } from "ethers";
import EstimateTx from "../../../../../utils/EstimateTx";
import { SendOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default ({
  nftTokenVO, nftAssetVO,
  to, amount,
  setTxHash, close
}: {
  nftTokenVO: NftTokenVO,
  nftAssetVO: NftAssetVO,
  to: string,
  amount: number,
  setTxHash: (txHash: string) => void,
  close: () => void
}) => {

  const { t } = useTranslation();
  const { provider, chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const INFTContract = nftTokenVO.type === 'erc1155' ? useINFT1155Contract(nftTokenVO.address, true) : useINFT721Contract(nftTokenVO.address, true);
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);


  const doSendTransaction = useCallback(async ({ to, amount }: { to: string, amount: number }) => {
    if (provider && chainId && INFTContract) {
      setSending(true);
      let data = undefined;
      let transferAmount = undefined;
      if (nftTokenVO.type === 'erc1155') {
      } else {
        transferAmount = 1;
        console.log({
          activeAccount,
          to,
          tokenId : nftAssetVO.tokenId
        });
        data = INFTContract.interface.encodeFunctionData("safeTransferFrom(address,address,uint256)", [
          activeAccount, to, BigNumber.from(nftAssetVO.tokenId)
        ]);
      }
      if (data === undefined) {
        return;
      }
      let tx: ethers.providers.TransactionRequest = {
        to: INFTContract.address,
        data,
        chainId,
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
          setTxHash(hash);
          setTransactionResponse(response);
          addTransaction({ to: INFTContract.address }, response, {
            call: {
              from: activeAccount,
              to: INFTContract.address,
              input: data,
              value: "0",
            }
          });
        }
      } catch (err: any) {
        setErr(err)
      } finally {
        setSending(false);
      }
    }
  }, [provider, INFTContract]);


  return <>
    <div style={{ minHeight: "300px" }}>
      {
        render
      }
      <br />
      <Row >
        <Col span={24}>
          <Text type="secondary">{t("wallet_tokens_contract")}</Text>
          <br />
          <AddressComponent style={{ fontSize: "16px" }} address={nftTokenVO.address} copyable qrcode />
        </Col>
        <Col span={24} style={{ marginTop: "10px" }}>
          <Row>
            <Col span={8}>
              <Row>
                <Col span={24}>
                  <Text type="secondary">资产ID</Text>
                </Col>
                <Col span={24}>
                  <Text strong># {nftAssetVO.tokenId}</Text>
                </Col>
              </Row>
            </Col>
            <Col span={8}>
              <NftAsset height={64} showTokenId={false} nftAssetVO={nftAssetVO} />
            </Col>
            <Col span={8} style={{ textAlign: "right" }}>
              {
                chainId && <NFTTokenLogoComponent height={40} style={{ width: "40px", height: "40px" }} chainId={chainId} address={nftTokenVO.address} />
              }
              <Row>
                <Col span={24}>
                  <Text strong>{nftTokenVO.name}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">{nftTokenVO.symbol}</Text>
                </Col>
              </Row>
            </Col>
          </Row>
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


  </>
}
