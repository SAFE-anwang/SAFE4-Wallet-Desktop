import { Tooltip, Typography } from "antd";
import useWalletName, { isLocalWallet } from "../../hooks/useWalletName";
import { WalletTwoTone } from "@ant-design/icons";
import { useMemo } from "react";
const { Title, Text, Paragraph } = Typography;
export default ({
  address,
  ellipsis,
  copyable
}: {
  address: string,
  ellipsis?: boolean,
  copyable?: boolean,
}) => {
  const { isLocal, isActive, name } = isLocalWallet(address);
  const addressLabel = ellipsis ? address.substring(0, 10) + "..." + address.substring(address.length - 8) : address;

  const walletColor = useMemo( () => {
    if ( isActive ){
      return "#0f5ce5e0";
    }
    if ( isLocal ){
      return "#90afe5e0";
    }
    return "";
  } , [ isLocal , isActive ] );

  return <div>
    <Text style={{
      fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace",
      color: walletColor
    }} italic={isActive}  >
      {addressLabel}
      {
        copyable && <Paragraph style={{ float: "right", height: "8px" }} copyable={{ text: address }} />
      }
      {
        isLocal && !isActive &&
        <Tooltip title={`本地钱包:${name}`}>
          <WalletTwoTone twoToneColor={walletColor} style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
        </Tooltip>
      }
      {
        isActive &&
        <Tooltip title={`当前钱包:${name}`}>
          <WalletTwoTone twoToneColor={walletColor} style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
        </Tooltip>
      }
    </Text>

  </div>

}
