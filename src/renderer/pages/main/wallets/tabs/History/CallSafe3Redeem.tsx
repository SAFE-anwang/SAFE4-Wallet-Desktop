import { Divider, Typography, } from "antd";
import { ApiOutlined, ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import { SupportSafe3Functions } from "../../../../../constants/DecodeSupportFunction";
import { useMemo } from "react";
import { JSBI } from "@uniswap/sdk";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({
  status,
  safe4Address,
  safe3Address,
  functionName,

  value,
  locked,
}: {
  status: number | undefined,
  safe4Address: string,
  safe3Address: string,
  functionName: string,

  value: JSBI,
  locked: JSBI,
}) => {

  const activeAccount = useWalletsActiveAccount();

  const _functionName = useMemo(() => {
    switch (functionName) {
      case SupportSafe3Functions.RedeemAvailable:
        return "迁移 Safe";
      case SupportSafe3Functions.RedeemLocked:
        return "迁移 锁仓";
      case SupportSafe3Functions.RedeemMasterNode:
        return "迁移 主节点";
      default:
    }
    return "";
  }, [functionName]);

  const RenderAssetFlow = () => {
    if (activeAccount == safe4Address) {
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
        <Text>资产迁移<Divider type="vertical" /><Text>{_functionName}</Text></Text>
      </>}
      status={status}
      description={<>
        <Text type="secondary">{safe3Address}</Text>
        <ArrowRightOutlined style={{ marginLeft: "5px", marginRight: "5px" }} />
        <Text >{safe4Address}</Text>
      </>}
      assetFlow={RenderAssetFlow()}
    />
  </>
}
