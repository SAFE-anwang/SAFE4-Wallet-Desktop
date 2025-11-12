import { Col, Divider, Row, Typography, } from "antd";
import { ApiOutlined, ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import { SupportSafe3Functions } from "../../../../../constants/DecodeSupportFunction";
import { useMemo } from "react";
import { JSBI } from "@uniswap/sdk";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  status,
  mappings,
  functionName,
  value,
  locked,
}: {
  status: number | undefined,
  mappings: {
    safe4Address: string,
    safe3Address: string,
  }[]
  functionName: string,
  value: JSBI,
  locked: JSBI,
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();

  const _functionName = useMemo(() => {
    switch (functionName) {
      case SupportSafe3Functions.BatchRedeemAvailable:
        return t("wallet_history_redeem_available");
      case SupportSafe3Functions.BatchRedeemLocked:
        return t("wallet_history_redeem_locked");
      case SupportSafe3Functions.BatchRedeemMasterNode:
        return t("wallet_history_redeem_masternode");
      case SupportSafe3Functions.BatchRedeemPetty:
        return t("wallet_history_redeem_petty");
      default:
    }
    return "";
  }, [functionName]);

  const RenderAssetFlow = () => {
    const safe4Addresses = mappings.map(mapping => mapping.safe4Address);
    if (safe4Addresses && safe4Addresses.indexOf(activeAccount) >= 0) {
      return <>
        {
          JSBI.greaterThan(locked, JSBI.BigInt(0)) &&
          <Text type="secondary" strong>
            <LockOutlined style={{ marginRight: "5px" }} />
            <Text type="success" strong>+{locked && EtherAmount({ raw: locked.toString(), fix: 18 })} SAFE</Text>
          </Text>
        }
        {
          JSBI.greaterThan(value, JSBI.BigInt(0)) &&
          <Text type="success" strong>
            +{value && EtherAmount({ raw: value.toString(), fix: 18 })} SAFE
          </Text>
        }
      </>
    } else {
      return <>

      </>
    }
  }

  return <>
    <TransactionElementTemplate
      icon={<ApiOutlined style={{ color: "black" }} />}
      title={<>
        <Text>{t("wallet_history_redeem")}<Divider type="vertical" /><Text>{_functionName}</Text></Text>
      </>}
      status={status}
      description={<>
        <Row>
          {
            mappings.filter((mapping, index) => index < 1).map(mapping => {
              const { safe3Address, safe4Address } = mapping;
              return <Col key={safe3Address} span={24}>
                <Text type="secondary">{safe3Address}</Text>
                <ArrowRightOutlined style={{ marginLeft: "5px", marginRight: "5px" }} />
                <Text >{safe4Address}</Text>
              </Col>
            })
          }
          {
            mappings.length > 1 && <Text type="secondary">[...]</Text>
          }
        </Row>
      </>}
      assetFlow={RenderAssetFlow()}
    />
  </>
}
