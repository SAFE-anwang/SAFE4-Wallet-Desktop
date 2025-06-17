import { Avatar } from "antd"
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../assets/logo/AssetsLogo"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"
import { ethers } from "ethers"
import { useAuditTokenList } from "../../state/audit/hooks";

const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const showPngFromHex = (hexData: string) => {
  const byteArray = hexToUint8Array(hexData);
  const blob = new Blob([byteArray], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  return url;
};

export default ({ chainId, address, style, hex, logoURI }: {
  chainId: number,
  address: string,
  style?: any,
  hex?: string,
  logoURI?: string
}) => {

  let isWSAFE = false;
  let isUSDT = false;

  const _address = ethers.utils.getAddress(address);

  const auditTokenMap = useAuditTokenList()?.reduce((map, current) => {
    map[current.address] = current;
    return map;
  }, {} as { [address: string]: any });
  const auditTokenLogoURI = auditTokenMap && auditTokenMap[_address] && auditTokenMap[_address].logoURI;
  if (chainId in Safe4NetworkChainId) {
    isWSAFE = _address == WSAFE[chainId as Safe4NetworkChainId].address;
    isUSDT = _address == USDT[chainId as Safe4NetworkChainId].address;
  } else {
    isWSAFE = (_address == WSAFE[Safe4NetworkChainId.Mainnet].address) || (_address == WSAFE[Safe4NetworkChainId.Testnet].address);
    isUSDT = (_address == USDT[Safe4NetworkChainId.Mainnet].address) || (_address == USDT[Safe4NetworkChainId.Testnet].address);
  }
  if (isWSAFE) {
    return <Avatar src={SAFE_LOGO} style={style ? { padding: "4px", width: "48px", height: "48px" , ...style } : { padding: "4px", width: "48px", height: "48px" }} />
  } else if (isUSDT) {
    return <Avatar src={USDT_LOGO} style={style ? { width: "40px", height: "40px", ...style, } : { width: "40px", height: "40px" }} />
  } else {
    if (hex && hex.length > 3) {
      return <Avatar src={showPngFromHex(hex)} style={style ? { width: "48px", height: "48px", ...style } : { width: "48px", height: "48px" }} />
    }
    if (logoURI || auditTokenLogoURI) {
      const URI = logoURI ? logoURI : auditTokenLogoURI;
      return <Avatar src={URI} style={style ? { width: "48px", height: "48px", ...style } : { width: "48px", height: "48px" }} />
    }
    return <Avatar src={ERC20_LOGO} style={style ? { padding: "4px", width: "48px", height: "48px", background: "#efefef", ...style } : { padding: "8px", width: "48px", height: "48px", background: "#efefef" }} />
  }
}
