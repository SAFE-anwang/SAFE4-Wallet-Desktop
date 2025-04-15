import { SafeswapV2FactoryAddreess, SafeswapV2RouterAddress } from "../config";
import SafeswapAbiConfig from "./SafeswapAbiConfig";


export enum SafeswapV2Contract {
  Router = SafeswapV2RouterAddress,
  Factory = SafeswapV2FactoryAddreess,
}

export const SafeswapV2ABI: { [address in SafeswapV2Contract]: string } = {
  [SafeswapV2Contract.Router]: SafeswapAbiConfig.SwapV2RouterABI,
  [SafeswapV2Contract.Factory]: SafeswapAbiConfig.SwapV2FactoryABI,
}
