import { useWeb3React } from "@web3-react/core";
import { Alert, Button, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useState } from "react";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { ethers } from "ethers";
import { NFT_Template } from "./NFT_Template_Config";
import { useContract } from "../../../../hooks/useContracts";
import { useTranslation } from "react-i18next";
import { SendOutlined } from "@ant-design/icons";
import EstimateTx from "../../../../utils/EstimateTx";
import { NftTokenVO } from "../../../../services/insight";
import useNFTMetadata from "../../../../hooks/useNFTMetadata";

const { Text } = Typography;

export default ({ openMintModal, setOpenMintModal, nftTokenVO }: {
  openMintModal: boolean,
  setOpenMintModal: (openMintModal: boolean) => void,
  nftTokenVO: NftTokenVO
}) => {

  const { t } = useTranslation();
  const cancel = () => {
    setOpenMintModal(false);
  }
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
  const ISRC721Contract = useContract(nftTokenVO.address, NFT_Template.SRC721.abi, true);

  const [inputParams, setInputParams] = useState<{
    toAddress: string,
    amount: string
  }>({
    toAddress: activeAccount,
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    toAddress?: string,
    amount?: string
  }>({
    toAddress: undefined,
    amount: undefined
  });
  const { tokenMetadata, loading } = useNFTMetadata(nftTokenVO.address);

  const doMint = async () => {
    const { toAddress, amount } = inputParams;
    console.log("Do Mint : ", {
      toAddress,
      amount
    })
    const _inputErrors: {
      toAddress?: undefined | string,
      amount?: undefined | string
    } = {
      toAddress: undefined,
      amount: undefined
    }
    if (!toAddress) {
      _inputErrors.toAddress = t("please_enter") + t("wallet_address");
    } else {
      if (!ethers.utils.isAddress(toAddress)) {
        _inputErrors.toAddress = t("enter_correct") + t("wallet_address");
      }
    }
    let tokenMintAmount = undefined;
    if (!amount) {
      _inputErrors.amount = t("please_enter") + t("wallet_issue_mint_amount");
    } else {
      try {
        tokenMintAmount = ethers.BigNumber.from(amount);
        if (tokenMintAmount.lte(ethers.BigNumber.from("0"))) {
          _inputErrors.amount = t("enter_correct") + t("wallet_issue_mint_amount");
        }
      } catch (err: any) {
        _inputErrors.amount = t("enter_correct") + t("wallet_issue_mint_amount");
      }
    }
    if (_inputErrors.amount || _inputErrors.toAddress) {
      setInputErrors({
        ..._inputErrors
      })
      return;
    }
    if (ISRC721Contract && tokenMintAmount && provider && chainId) {
      setSending(true);
      const data = ISRC721Contract.interface.encodeFunctionData("adminMint", [
        toAddress,
        tokenMintAmount
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: ISRC721Contract.address,
        data,
        chainId,
      };
      try {
        tx = await EstimateTx(activeAccount, chainId, tx, provider);
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
      } catch (err) {
        setErr(err);
      } finally {
        setSending(false);
      }
    }
  }

  console.log("TokenMetadata ==", tokenMetadata)

  return <Modal width={800} open={openMintModal} footer={null} title={t("wallet_issue_mint_asset")} onCancel={() => cancel()}>
    <Divider />
    <Spin spinning={loading} >
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
        <Col span={24}>
          <Text type="secondary">{t("wallet_issue_mint_address")}</Text>
        </Col>
        <Col span={16}>
          <Input size="large" value={inputParams.toAddress} onChange={(event) => {
            const inputValue = event.target.value;
            setInputParams({
              ...inputParams,
              toAddress: inputValue
            });
            setInputErrors({
              ...inputErrors,
              toAddress: undefined
            })
          }}></Input>
          {
            inputErrors.toAddress && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
              {inputErrors.toAddress}
            </>} />
          }
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Text type="secondary">{t("wallet_issue_mint_amount")}</Text>
        </Col>
        <Col span={16}>
          <Input size="large" value={inputParams.amount} onChange={(event) => {
            const inputValue = event.target.value;
            setInputParams({
              ...inputParams,
              amount: inputValue
            });
            setInputErrors({
              ...inputErrors,
              amount: undefined
            })
          }} />
          {
            inputErrors.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
              {inputErrors.amount}
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
                {err.reason ?? err.toString()}
              </>} />
            </>
          }
          {
            !sending && !render && <Button icon={<SendOutlined />} onClick={() => {
              doMint();
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
  </Modal >

}
