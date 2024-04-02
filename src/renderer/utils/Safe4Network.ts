import { Safe4_Network_Config } from "../config";

export function isSafe4Network( chainId : number ){
  return isSafe4Mainnet( chainId ) || isSafe4Testnet(chainId);
}

export function isSafe4Mainnet( chainId : number ){
  return chainId == Safe4_Network_Config.Mainnet.chainId ;
}

export function isSafe4Testnet( chainId : number ){
  return chainId == Safe4_Network_Config.Testnet.chainId ;
}
