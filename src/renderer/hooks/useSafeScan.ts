import { useWeb3React } from "@web3-react/core"
import config, { Safe4_Network_Config } from "../config";

export default (): {
  URL: string,
  API: string
} => {
  const { chainId, provider } = useWeb3React();
  const endpoint = provider?.connection.url;
  // return {
  //   URL: chainId == Safe4_Network_Config.Testnet.chainId ?
  //     Safe4_Network_Config.Testnet.Safescan_URL : Safe4_Network_Config.Mainnet.Safescan_URL,
  //   API: chainId == Safe4_Network_Config.Testnet.chainId ?
  //     Safe4_Network_Config.Testnet.Safescan_Api : Safe4_Network_Config.Mainnet.Safescan_Api,
  // }
  return {
    URL: endpoint == Safe4_Network_Config.Testnet.endpoint ?
      Safe4_Network_Config.Testnet.Safescan_URL : Safe4_Network_Config.Mainnet.Safescan_URL,
    API: endpoint == Safe4_Network_Config.Testnet.endpoint ?
      Safe4_Network_Config.Testnet.Safescan_Api : Safe4_Network_Config.Mainnet.Safescan_Api,
  }
}
