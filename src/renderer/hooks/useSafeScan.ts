import { useWeb3React } from "@web3-react/core"
import { Safe4_Network_Config } from "../config";

export default (): {
  URL: string,
  API: string,
  INSIGHT_API: string,
  API_Crosschain: string
} => {
  const { chainId } = useWeb3React();
  return {
    URL: chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_URL : Safe4_Network_Config.Mainnet.Safescan_URL,
    API: chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_Api : Safe4_Network_Config.Mainnet.Safescan_Api,
    INSIGHT_API: chainId == Safe4_Network_Config.Testnet.chainId ?
      Safe4_Network_Config.Testnet.Safescan_InsightApi : Safe4_Network_Config.Mainnet.Safescan_InsightApi,
    API_Crosschain: "https://safe4.anwang.com/crosschain",
  }
}



