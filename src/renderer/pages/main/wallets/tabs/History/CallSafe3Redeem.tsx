import { Divider, Typography, } from "antd";
import { ApiOutlined, ArrowRightOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import { SupportSafe3Functions } from "../../../../../constants/DecodeSupportFunction";
import { useMemo } from "react";

const { Text } = Typography;

export default ({
  status,
  safe4Address,
  safe3Address,
  functionName
}: {
  status: number | undefined,
  safe4Address: string,
  safe3Address: string,
  functionName: string
}) => {

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
  }, [functionName])

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
      assetFlow={<>
      </>}
    />
  </>
}
