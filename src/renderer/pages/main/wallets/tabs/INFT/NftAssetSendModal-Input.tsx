import { useCallback, useState } from "react";
import { NftAssetVO, NftTokenVO } from "../../../../../services/insight"
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";
import { Alert, Button, Col, Divider, Input, Row, Space, Typography } from "antd";
import AddressComponent from "../../../../components/AddressComponent";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import NFTTokenLogoComponent from "../../../../components/NFTTokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import NftAsset from "./NftAsset";

const { Text } = Typography;


export default ({
  nftTokenVO, nftAssetVO, goNextCallback
}: {
  nftTokenVO: NftTokenVO,
  nftAssetVO: NftAssetVO,
  goNextCallback: ({ to, amount }: { to: string, amount: number }) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const { chainId } = useWeb3React();
  const [params, setParams] = useState<{
    to: string,
    amount: number,
  }>({
    to: "",
    amount: 1,
  });
  const [inputErrors, setInputErrors] = useState<{
    to: string | undefined,
    amount: string | undefined,
  }>({
    to: undefined,
    amount: undefined,
  });

  const goNext = useCallback(() => {
    const { to, amount } = params;
    if (!to || !ethers.utils.isAddress(to)) {
      inputErrors.to = t("enter_correct") + t("wallet_address");
    }
    if (!amount) {
      inputErrors.amount = t("enter") + t("wallet_send_amount");
    }
    if (inputErrors.to || inputErrors.amount) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);
  }, [params]);


  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message={"将账户中的 NFT 资产发送到指定钱包地址"} />
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
          <AddressComponent style={{ fontSize: "16px" }} address={activeAccount} copyable qrcode />
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_to")}</Text>
          <br />
          <Input size="large" onChange={(_input) => {
            const toInputValue = _input.target.value;
            setParams({
              ...params,
              to: toInputValue
            });
            setInputErrors({
              ...inputErrors,
              to: undefined
            })
          }} placeholder={t("wallet_send_to_placeholder")}></Input>
        </Col>
        {
          inputErrors?.to && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.to} />
        }
      </Row>
      <br />

      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={goNext}>{t("next")}</Button>
        </Col>
      </Row>
    </div>


  </>
}
