import { Token, TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useState } from "react";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { Contract, ethers } from "ethers";
import { NFT_Template } from "./NFT_Template_Config";
import { useContract } from "../../../../hooks/useContracts";
import { useTranslation } from "react-i18next";
import { SendOutlined } from "@ant-design/icons";
import EstimateTx from "../../../../utils/EstimateTx";
import { NftTokenVO } from "../../../../services/insight";
import useNFTMetadata from "../../../../hooks/useNFTMetadata";

const { Text } = Typography;

export default ({ openBurnModal, setOpenBurnModal, nftTokenVO }: {
  openBurnModal: boolean,
  setOpenBurnModal: (openMintModal: boolean) => void,
  nftTokenVO: NftTokenVO
}) => {

  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();
  const {
    render,
    setTransactionResponse,
    setErr,
    response,
    err
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const ISRC721Contract = useContract(nftTokenVO.address, NFT_Template.SRC721_burnable.abi, true);
  const { tokenMetadata, loading } = useNFTMetadata(nftTokenVO.address);
  const cancel = () => {
    setOpenBurnModal(false);
  }
  const [inputParams, setInputParams] = useState<{
    tokenId: string
  }>({
    tokenId: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    tokenId?: string
  }>({
    tokenId: undefined
  });

  const doBurn = async () => {
    const { tokenId } = inputParams;
    const _inputErrors: {
      tokenId?: undefined | string
    } = {
      tokenId: undefined
    }
    let burnTokenId = undefined;
    if (!tokenId) {
      _inputErrors.tokenId = t("please_enter") + t("wallet_issue_burn_amount");
    } else {
      try {
        burnTokenId = ethers.BigNumber.from(tokenId);
      } catch (err: any) {
        _inputErrors.tokenId = t("enter_correct") + t("wallet_issue_burn_amount");
      }
    }
    if (_inputErrors.tokenId) {
      setInputErrors({
        ..._inputErrors
      })
      return;
    }
    if (ISRC721Contract && burnTokenId && chainId && provider) {
      setSending(true);
      const data = ISRC721Contract.interface.encodeFunctionData("burn", [
        burnTokenId
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: ISRC721Contract.address,
        data,
        chainId,
      };
      try {
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
        console.log("Burn TokenID =", burnTokenId)
        const { signedTx, error } = await window.electron.wallet.signTransaction(
          activeAccount,
          tx
        );
        if (signedTx) {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          addTransaction({ to: ISRC721Contract.address }, response, {
            call: {
              from: activeAccount,
              to: ISRC721Contract.address,
              input: data,
              value: "0"
            }
          });
          setTransactionResponse(response);
          setTxHash(hash);
        }
        if (error) {
          setErr(error);
        }
      } catch (err: any) {
        console.log("Burn Err:", err.reason);
        setErr(err);
      } finally {
        setSending(false);
      }
    }
  }

  return <Modal width={800} open={openBurnModal} footer={null} title={t("wallet_issue_burn_asset")} destroyOnClose onCancel={() => cancel()}>
    <Divider />

    <Spin spinning={loading}>
      <Row>
        <Col span={12}>
          <Text type="secondary">{t("wallet_src20_name")}</Text>
          <br />
          <Text strong>{tokenMetadata?.name}</Text>
        </Col>
        <Col span={12}>
          <Text type="secondary">{t("wallet_src20_symbol")}</Text>
          <br />
          <Text strong>{tokenMetadata?.symbol}</Text>
        </Col>
        <Col span={12} style={{ marginTop: "20px" }}>
          <Text type="secondary">当前供应量</Text>
          <br />
          <Text strong>
            {tokenMetadata?.totalSupply.toString()}
          </Text>
        </Col>
        <Col span={12} style={{ marginTop: "20px" }}>
          <Text type="secondary">最大供应量</Text>
          <br />
          <Text strong>
            {tokenMetadata?.maxSupply.toString()}
          </Text>
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Text type="secondary">资产ID</Text>
        </Col>
        <Col span={16}>
          <Input size="large" value={inputParams.tokenId} onChange={(event) => {
            const inputValue = event.target.value;
            setInputParams({
              ...inputParams,
              tokenId: inputValue
            });
            setInputErrors({
              ...inputErrors,
              tokenId: undefined
            })
          }} />
          {
            inputErrors.tokenId && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
              {inputErrors.tokenId}
            </>} />
          }
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          {
            txHash && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="success" message={<>
                {txHash}
              </>} />
            </>
          }
          {
            err && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="error" message={<>
                {err.reason ?? err.error.toString()}
              </>} />
            </>
          }
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doBurn();
            }} type="primary">
              {t("wallet_send_status_broadcast")}
            </Button>
          }
          {
            sending && !render && <Button loading disabled type="primary">
              {t("wallet_send_status_sending")}
            </Button>
          }
          {
            render && <Button onClick={cancel}>
              {t("wallet_send_status_close")}
            </Button>
          }
        </Col>
      </Row>
    </Spin>
  </Modal>

}
