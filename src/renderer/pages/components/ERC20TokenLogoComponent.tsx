import { Avatar } from "antd"
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../assets/logo/AssetsLogo"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"
import { ethers } from "ethers"

export default ({ chainId, address, style }: {
  chainId: number,
  address: string,
  style?: any
}) => {
  let isWSAFE = false;
  let isUSDT = false;
  const _address = ethers.utils.getAddress(address);
  if (chainId in Safe4NetworkChainId) {
    isWSAFE = _address == WSAFE[chainId as Safe4NetworkChainId].address;
    isUSDT = _address == USDT[chainId as Safe4NetworkChainId].address;
  } else {
    isWSAFE = (_address == WSAFE[Safe4NetworkChainId.Mainnet].address) || (_address == WSAFE[Safe4NetworkChainId.Testnet].address);
    isUSDT = (_address == USDT[Safe4NetworkChainId.Mainnet].address) || (_address == USDT[Safe4NetworkChainId.Testnet].address);
  }
  if (isWSAFE) {
    return <Avatar src={SAFE_LOGO} style={style ? style : { padding: "4px", width: "48px", height: "48px" }} />
  } else if (isUSDT) {
    return <Avatar src={USDT_LOGO} style={style ? style : { width: "40px", height: "40px" }} />
  } else {
    return <Avatar src={ERC20_LOGO} style={style ? style : { padding: "8px", width: "48px", height: "48px", background: "#efefef" }} />
  }
}
