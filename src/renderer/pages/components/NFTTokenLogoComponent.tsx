import { Avatar } from "antd"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"
import { ethers } from "ethers"
import { useAuditTokenList, useNftTokens } from "../../state/audit/hooks";
import NFT_PLACEHOLDER from "../../assets/logo/nft-placeholder.svg";

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

export default ({ chainId, address, height, style, hex, logoURI }: {
  chainId: number,
  address: string,
  height?: number,
  style?: any,
  hex?: string,
  logoURI?: string
}) => {

  const _address = ethers.utils.getAddress(address);
  const auditTokenMap = useNftTokens()?.reduce((map, current) => {
    map[current.address] = current;
    return map;
  }, {} as { [address: string]: any });
  const auditTokenLogoURI = auditTokenMap && auditTokenMap[_address] && auditTokenMap[_address].logoURI;

  if (hex && hex.length > 3) {
    return <Avatar src={showPngFromHex(hex)} style={style ? { width: "48px", height: "48px", ...style } : { width: "48px", height: "48px" }} />
  }
  if (logoURI || auditTokenLogoURI) {
    const URI = logoURI ? logoURI : auditTokenLogoURI;
    return <Avatar src={URI} style={style ? { width: "48px", height: "48px", ...style } : { width: "48px", height: "48px" }} />
  }

  return <Avatar
    src={<img src={NFT_PLACEHOLDER} style={{ height: height ? height : 48 }} />}
    style={style ? { width: "48px", height: "48px", ...style }
      : { width: "48px", height: "48px" }}
  />

}
