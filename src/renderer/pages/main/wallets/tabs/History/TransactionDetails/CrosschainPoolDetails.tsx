import { Avatar, Button, Card, Col, Row, Tooltip, Typography } from "antd"
import { TransactionDetails } from "../../../../../../state/transactions/reducer"
import TokenLogo from "../../../../../components/TokenLogo";
import { useWalletsActiveAccount } from "../../../../../../state/wallets/hooks";
import AddressComponent from "../../../../../components/AddressComponent";
import { CrosschainDirection, getCrosschainDirection } from "../TransactionElementCallCrosschainPool";
import { getNetworkExplorerURLByCoin, getNetworkExplorerURLByTxPrefix, getNetworkLogoByCoin, getNetworkLogoByTxIDPrefix, getNetworkNameByCoin, getNetworkNameByTxPrefix, NetworkCoinType, NetworkTxIdPrefix } from "../../../../../../assets/logo/NetworkLogo";
import { ethers } from "ethers";
import { GlobalOutlined, SyncOutlined } from "@ant-design/icons";
import EtherAmount from "../../../../../../utils/EtherAmount";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCrosschain, useTransaction } from "../../../../../../state/transactions/hooks";
import { useTranslation } from "react-i18next";
import { getCrosschainPoolInfo } from "../../../../../../constants/DecodeSupportFunction";

const { Text } = Typography;

export default ({
  support, transaction
}: {
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
  transaction: TransactionDetails
}) => {
  const { t } = useTranslation();
  const {
    hash,
    status,
    call,
  } = transaction;
  const { from, to, value } = call ? call : {
    from: null, to: null, value: null
  };
  const activeAccount = useWalletsActiveAccount();
  const crosschainDirection = getCrosschainDirection(support.supportFuncName);
  const crosschainData = useCrosschain(hash);
  const crosschainSpin = useMemo(() => {
    if (crosschainDirection) {
      if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS) {
        return !(crosschainData && crosschainData.status == 4)
      } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
        return false;
      }
    }
  }, [crosschainData]);

  const { isCrosschainPoolBSC, isCrosschainPoolETH, isCrosschainPoolMATIC } = useMemo(() => {
    if (from && to) {
      return getCrosschainPoolInfo(to, from);
    }
    return {
      isCrosschainPoolBSC: false, isCrosschainPoolETH: false, isCrosschainPoolMATIC: false
    }

  }, [crosschainDirection, from, to])

  const RenderCrosschainStatus = useCallback(() => {
    if (crosschainData && crosschainData.status == 4) {
      return <Text type="success" strong>{t("wallet_crosschain_status_finished")}</Text>
    }
    return <Text strong type="secondary" italic>{t("wallet_crosschain_status_unconfirm")}</Text>
  }, [crosschainData]);

  const RenderCrosschainFrom = () => {
    if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS) {
      return <>
        <Col span={2} style={{ paddingTop: "8px" }}>
          <TokenLogo width="30px" height="30px" />
        </Col>
        <Col span={22}>
          <Text strong>SAFE4 {t("network")}</Text>
          <br />
          <AddressComponent address={activeAccount} />
        </Col>
      </>
    } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
      let txIdPrefix = isCrosschainPoolBSC ? NetworkTxIdPrefix.BID :
        isCrosschainPoolETH ? NetworkTxIdPrefix.EID :
          isCrosschainPoolMATIC ? NetworkTxIdPrefix.MID : undefined;
      return <>
        <Col span={2} style={{ paddingTop: "8px" }}>
          {txIdPrefix && <Avatar src={getNetworkLogoByTxIDPrefix(txIdPrefix)} />}
        </Col>
        <Col span={22}>
          {
            txIdPrefix && <Text strong>{getNetworkNameByTxPrefix(txIdPrefix)}</Text>
          }
          <br />
          {
            crosschainData && crosschainData.srcAddress && ethers.utils.isAddress(crosschainData.srcAddress) &&
            <AddressComponent address={crosschainData.srcAddress} />
          }
        </Col>
      </>
    }
  }

  const RenderCrosschainTo = () => {
    let coinType = isCrosschainPoolBSC ? NetworkCoinType.BSC :
      isCrosschainPoolETH ? NetworkCoinType.ETH :
        isCrosschainPoolMATIC ? NetworkCoinType.MATIC : undefined;
    if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS) {
      return <>
        <Col span={2} style={{ paddingTop: "8px" }}>
          {
            coinType && <Avatar src={getNetworkLogoByCoin(coinType)} />
          }
        </Col>
        <Col span={22}>
          {
            coinType && <Text strong>{getNetworkNameByCoin(coinType)} {t("network")}</Text>
          }
          <br />
          {
            support.inputDecodeResult && ethers.utils.isAddress(support.inputDecodeResult)
            && <AddressComponent address={support.inputDecodeResult} />
          }
        </Col>
      </>
    } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
      return <>
        <Col span={2} style={{ paddingTop: "8px" }}>
          <TokenLogo />
        </Col>
        <Col span={22}>
          <Text strong>SAFE4 {t("network")}</Text>
          <br />
          {
            call?.to && <AddressComponent address={call?.to} />
          }
        </Col>
      </>
    }
  }

  return <>
    <Row>
      <Text type="secondary">{t("wallet_crosschain")}</Text>
    </Row>
    <Card>
      {/* <Text>{JSON.stringify(support)}</Text> */}
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_crosschain_asset")}</Text>
        </Col>
        <Col span={24}>
          {
            crosschainSpin && <SyncOutlined spin={crosschainSpin} style={{ fontSize: "28px" }} />
          }
          <Text style={{ fontSize: "28px", marginLeft: "5px" }} strong>
            {
              call?.value && <>
                <EtherAmount raw={call?.value} /> SAFE
              </>
            }
          </Text>
        </Col>
      </Row>

      {
        crosschainDirection == CrosschainDirection.NETWORKS_SAFE4 && support.inputDecodeResult &&
        <Row style={{ marginTop: "15px" }}>
          <Col span={4}>
            <Text type="secondary">{t("wallet_crosschain_fromtxhash")}</Text>
          </Col>
          <Col span={20}>
            <Text style={{ float: "right" }}>
              <Tooltip title="在浏览器上查看">
                <Button size="small" icon={<GlobalOutlined onClick={() => window.open(`${getNetworkExplorerURLByTxPrefix(support.supportFuncName as NetworkTxIdPrefix)}/tx/${support.inputDecodeResult}`)} />} />
              </Tooltip>
            </Text>
          </Col>
          <Col>
            <Text>{support.inputDecodeResult}</Text>
          </Col>
        </Row>
      }

      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_crosschain_from")}</Text>
        </Col>
        {RenderCrosschainFrom()}
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={24}>
          <Text type="secondary">{t("wallet_crosschain_crossto")}</Text>
        </Col>
        {RenderCrosschainTo()}
      </Row>

      {
        crosschainDirection == CrosschainDirection.SAFE4_NETWORKS && crosschainData && crosschainData.dstTxHash &&
        <Row style={{ marginTop: "15px" }}>
          <Col span={4}>
            <Text type="secondary">跨链确认</Text>
          </Col>
          <Col span={20}>
            <Text style={{ float: "right" }}>
              <Tooltip title="在浏览器上查看">
                <Button size="small" icon={<GlobalOutlined onClick={() => window.open(`${getNetworkExplorerURLByCoin(crosschainData.dstNetwork as NetworkCoinType)}/tx/${crosschainData.dstTxHash}`)} />} />
              </Tooltip>
            </Text>
          </Col>
          <Col>
            <Text>{crosschainData.dstTxHash}</Text>
          </Col>
        </Row>
      }

      <Row style={{ marginTop: "10px" }}>
        <Col span={8}>
          <Text type="secondary">{t("wallet_crosschain_status")}</Text><br />
          {
            RenderCrosschainStatus()
          }
        </Col>
        {
          crosschainData && crosschainData.status == 4 && <>
            <Col span={8}>
              <Text type="secondary">{t("wallet_crosschain_receive_amount")}</Text><br />
              <Text strong>
                {
                  crosschainData?.dstAmount
                } SAFE
              </Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">{t("wallet_crosschain_fee")}</Text><br />
              <Text strong>
                {
                  crosschainData?.fee
                } SAFE
              </Text>
            </Col>
          </>
        }
      </Row>
    </Card>
  </>
}
