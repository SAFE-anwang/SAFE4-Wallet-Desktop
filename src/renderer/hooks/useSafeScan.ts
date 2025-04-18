import { useWeb3React } from "@web3-react/core"
import config, { Safe4_Network_Config } from "../config";

export default (): {
  URL: string,
  API: string,
  API_Crosschain : string
} => {
  const { chainId } = useWeb3React();
  return {
    URL: chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_URL : Safe4_Network_Config.Mainnet.Safescan_URL,

    API: chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_Api : Safe4_Network_Config.Mainnet.Safescan_Api,

    API_Crosschain: (chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_URL : Safe4_Network_Config.Mainnet.Safescan_URL) + "/crosschain" ,
  }
}



