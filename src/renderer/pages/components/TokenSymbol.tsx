import { Token } from "@uniswap/sdk";
import { Safe4NetworkChainId, WSAFE } from "../../config";

export default (token: Token) => {
  const address = token.address;
  if (address == WSAFE[Safe4NetworkChainId.Testnet].address
    || address == WSAFE[Safe4NetworkChainId.Mainnet].address
  ) {
    return "SAFE";
  }
  return token.symbol;
}
