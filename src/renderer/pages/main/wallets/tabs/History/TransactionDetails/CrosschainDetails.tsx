import { Avatar, Button, Card, Col, Row, Tooltip, Typography } from "antd"
import { TransactionDetails } from "../../../../../../state/transactions/reducer"
import TokenLogo from "../../../../../components/TokenLogo";
import { useWalletsActiveAccount } from "../../../../../../state/wallets/hooks";
import AddressComponent from "../../../../../components/AddressComponent";
import { CrosschainDirection, getCrosschainDirection } from "../TransactionElementCallCrosschainPool";
import { getNetworkExplorerURLByCoin, getNetworkExplorerURLByTxPrefix, getNetworkLogoByCoin, getNetworkLogoByTxIDPrefix, getNetworkNameByCoin, getNetworkNameByTxPrefix, NetworkCoinType, NetworkTxIdPrefix } from "../../../../../../assets/logo/NetworkLogo";
import { ethers } from "ethers";
import { GlobalOutlined, SyncOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCrosschain, useTransaction } from "../../../../../../state/transactions/hooks";
import { useTranslation } from "react-i18next";
import ERC20TokenLogoComponent from "../../../../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { TokenAmount } from "@uniswap/sdk";
import { Safe4NetworkChainId, USDT } from "../../../../../../config";

const { Text } = Typography;


function toPlainString(num: number | string): string {
  const str = String(num);
  if (!str.includes('e')) return str;
  const [base, exponent] = str.split('e');
  let exp = Number(exponent);
  let [integer, fraction = ''] = base.split('.');
  if (exp > 0) {
    return integer + fraction.padEnd(exp + fraction.length, '0');
  } else {
    exp = Math.abs(exp);
    return '0.' + '0'.repeat(exp - 1) + integer + fraction;
  }
}
function normalizeDecimals(value: string, decimals: number): string {
  if (!value.includes('.')) return value
  const [intPart, fracPart] = value.split('.')
  return intPart + '.' + fracPart.slice(0, decimals)  // 截断小数位
}

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
  const { chainId } = useWeb3React();
  const USDT_Token = chainId && USDT[chainId as Safe4NetworkChainId];
  const activeAccount = useWalletsActiveAccount();
  const {
    hash,
    call,
  } = transaction;
  const crosschainDirection = support.supportFuncName == "crossChainRedeem" ?
    CrosschainDirection.SAFE4_NETWORKS : CrosschainDirection.NETWORKS_SAFE4;
  const { from, to, srcTxHash, networkCoin, amount } = useMemo(() => {
    if (crosschainDirection == CrosschainDirection.SAFE4_NETWORKS && USDT_Token) {
      return {
        from: call?.from,
        to: support.inputDecodeResult._to,
        srcTxHash: hash,
        networkCoin: support.inputDecodeResult._network,
        amount: new TokenAmount(
          USDT[Safe4NetworkChainId.Mainnet],
          support.inputDecodeResult._value
        )
      }
    } else {
      const _txId = support.inputDecodeResult._txId;
      return {
        from: "",
        to: support.inputDecodeResult._to,
        srcTxHash : _txId,
        networkCoin: support.inputDecodeResult._network,
        amount: new TokenAmount(
          USDT[Safe4NetworkChainId.Mainnet],
          support.inputDecodeResult._amount
        )
      }
    }
  }, [transaction, support, crosschainDirection, USDT_Token]);
  const crosschainData = useCrosschain(srcTxHash);
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
    const network = support.inputDecodeResult._network;
    return {
      isCrosschainPoolBSC: network == 'bsc',
      isCrosschainPoolETH: network == 'eth',
      isCrosschainPoolMATIC: network == 'matic'
    }
  }, [crosschainDirection, from, to, support]);

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
          {
            USDT_Token && <ERC20TokenLogoComponent style={{ width: "32px", height: "32px" }} address={USDT_Token.address} chainId={chainId} />
          }
        </Col>
        <Col span={22}>
          <Text strong>SAFE4 {t("network")}</Text>
          <br />
          <AddressComponent address={activeAccount} />
        </Col>
      </>
    } else if (crosschainDirection == CrosschainDirection.NETWORKS_SAFE4) {
      return <>
        <Col span={2} style={{ paddingTop: "8px" }}>
          {networkCoin && <Avatar src={getNetworkLogoByCoin(networkCoin)} />}
        </Col>
        <Col span={22}>
          {
            networkCoin && <Text strong>{getNetworkNameByCoin(networkCoin)}</Text>
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
            support.inputDecodeResult && ethers.utils.isAddress(support.inputDecodeResult._to)
            && <AddressComponent address={support.inputDecodeResult._to} />
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
            support.inputDecodeResult && ethers.utils.isAddress(support.inputDecodeResult._to)
            && <AddressComponent address={support.inputDecodeResult._to} />
          }
        </Col>
      </>
    }
  }

  const outputFee = () => {
    if (crosschainData && crosschainData.fee && USDT_Token) {
      const fee = new TokenAmount(
        USDT_Token,
        ethers.utils.parseUnits(
          normalizeDecimals(
            toPlainString(crosschainData.fee),
            USDT_Token.decimals
          ),
          USDT_Token.decimals
        ).toBigInt()
      )
      return <>
        {fee.toSignificant()} USDT
      </>
    }
  }

  return <>
    <Row>
      <Text type="secondary">{t("wallet_crosschain")}</Text>
    </Row>
    <Card>
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
              USDT_Token && amount && amount.toSignificant(USDT_Token.decimals)
            } USDT
          </Text>
        </Col>
      </Row>

      {
        crosschainDirection == CrosschainDirection.NETWORKS_SAFE4 &&
        <Row style={{ marginTop: "15px" }}>
          <Col span={4}>
            <Text type="secondary">{t("wallet_crosschain_fromtxhash")}</Text>
          </Col>
          <Col span={20}>
            <Text style={{ float: "right" }}>
              <Tooltip title="在浏览器上查看">
                <Button size="small" icon={<GlobalOutlined onClick={() => window.open(`${getNetworkExplorerURLByCoin(networkCoin)}/tx/${srcTxHash}`)} />} />
              </Tooltip>
            </Text>
          </Col>
          <Col>
            <Text>{srcTxHash}</Text>
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
                } USDT
              </Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">{t("wallet_crosschain_fee")}</Text><br />
              <Text strong>
                {outputFee()}
              </Text>
            </Col>
          </>
        }
      </Row>
    </Card>
  </>
}
