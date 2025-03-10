import { Avatar } from "antd"
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../assets/logo/AssetsLogo"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"

export default ({ chainId, address, style }: {
  chainId: number,
  address: string,
  style?: any
}) => {
  let isWSAFE = false;
  let isUSDT = false;
  if (chainId in Safe4NetworkChainId) {
    isWSAFE = address == WSAFE[chainId as Safe4NetworkChainId].address;
    isUSDT = address == USDT[chainId as Safe4NetworkChainId].address;
  } else {
    isWSAFE = (address == WSAFE[Safe4NetworkChainId.Mainnet].address) || (address == WSAFE[Safe4NetworkChainId.Testnet].address);
    isUSDT = (address == USDT[Safe4NetworkChainId.Mainnet].address) || (address == USDT[Safe4NetworkChainId.Testnet].address);
  }
  if (isWSAFE) {
    return <Avatar src={SAFE_LOGO} style={style ? style : { padding: "4px", width: "48px", height: "48px" }} />
  } else if (isUSDT) {
    return <Avatar src={USDT_LOGO} style={style ? style : { width: "40px", height: "40px" }} />
  } else {
    return <Avatar src={ERC20_LOGO} style={style ? style : { padding: "8px", width: "48px", height: "48px", background: "#efefef" }} />
  }
}
