import { Tooltip, Typography } from "antd";
import useWalletName, { isLocalWallet } from "../../hooks/useWalletName";
import { WalletTwoTone } from "@ant-design/icons";
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
  const { isLocal, name } = isLocalWallet(address);
  const addressLabel = ellipsis ? address.substring(0, 10) + "..." + address.substring(address.length - 8) : address;
  return <div>
    <Text style={{
      fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace",
      color: isLocal ? "#4780e1e0" : ""
    }} italic={isLocal}  >
      {addressLabel}
      {
        copyable && <Paragraph style={{ float: "right", height: "8px" }} copyable={{ text: address }} />
      }
      {
        isLocal &&
        <Tooltip title={`本地钱包:${name}`}>
          <WalletTwoTone style={{ float: "right", marginTop: "4px", marginRight: "6px" }} />
        </Tooltip>
      }
    </Text>

  </div>

}
