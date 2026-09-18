import { BlockchainRpcProp } from "../../../state/dApp/reducer";


export const Default_BlockchainRpcProps : { [chainId: number]: BlockchainRpcProp } = {
  1: {
    chainId: 1,
    rpcUrls: ["https://ethereum-mainnet.core.chainstack.com/a1911ee247f4f8de22c1f4e55865f616"],
    blockExplorerUrls: ["https://etherscan.io"],
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    chainName: "Ethereum Mainnet",
  },
  56: {
    chainId: 56,
    rpcUrls: ["https://bsc-mainnet.core.chainstack.com/7aa5182be577dd02e86786a7cb1dc0c1"],
    blockExplorerUrls: ["https://bscscan.com"],
    nativeCurrency: {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
    },
    chainName: "Binance Smart Chain Mainnet",
  },
  6666666: {
    chainId: 6666666,
    rpcUrls: ["https://safe4testnet.anwang.com/rpc"],
    blockExplorerUrls: ["https://bscscan.com"],
    nativeCurrency: {
      name: "SAFE",
      symbol: "SAFE",
      decimals: 18,
    },
    chainName: "Safe4 Testnet",
  },
  6666665: {
    chainId: 6666665,
    rpcUrls: ["https://safe4.anwang.com/rpc"],
    blockExplorerUrls: ["https://safe4.anwang.com"],
    nativeCurrency: {
      name: "SAFE",
      symbol: "SAFE",
      decimals: 18,
    },
    chainName: "Safe4 Mainnet",
  }


}
