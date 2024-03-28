import type { AddEthereumChainParameter } from '@web3-react/types'

const SAFE4 : AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Safe4',
  symbol: 'SAFE',
  decimals: 18,
}

const ETH: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
}

const MATIC: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Matic',
  symbol: 'MATIC',
  decimals: 18,
}

const CELO: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'Celo',
  symbol: 'CELO',
  decimals: 18,
}

interface BasicChainInformation {
  urls: string[]
  name: string
}

interface ExtendedChainInformation extends BasicChainInformation {
  nativeCurrency: AddEthereumChainParameter['nativeCurrency']
  blockExplorerUrls: AddEthereumChainParameter['blockExplorerUrls']
}

function isExtendedChainInformation(
  chainInformation: BasicChainInformation | ExtendedChainInformation
): chainInformation is ExtendedChainInformation {
  return !!(chainInformation as ExtendedChainInformation).nativeCurrency
}

export function getAddChainParameters(chainId: number): AddEthereumChainParameter | number {
  const chainInformation = CHAINS[chainId]
  if (isExtendedChainInformation(chainInformation)) {
    return {
      chainId,
      chainName: chainInformation.name,
      nativeCurrency: chainInformation.nativeCurrency,
      rpcUrls: chainInformation.urls,
      blockExplorerUrls: chainInformation.blockExplorerUrls,
    }
  } else {
    return chainId
  }
}

// const getInfuraUrlFor = (network: string) =>
//   process.env.infuraKey ? `https://${network}.infura.io/v3/${process.env.infuraKey}` : undefined
// const getAlchemyUrlFor = (network: string) =>
//   process.env.alchemyKey ? `https://${network}.alchemyapi.io/v2/${process.env.alchemyKey}` : undefined

type ChainConfig = { [chainId: number]: BasicChainInformation | ExtendedChainInformation }

export const MAINNET_CHAINS: ChainConfig = {
  6666666: {
    urls: ['http://172.104.162.94:8544','http://172.104.162.94:8545'].filter(Boolean),
    name: 'Safe4',
    nativeCurrency: SAFE4,
  },
  1: {
    urls: ['https://cloudflare-eth.com'].filter(Boolean),
    name: 'Mainnet',
  },
  10: {
    urls: ['https://mainnet.optimism.io'].filter(Boolean),
    name: 'Optimism',
    nativeCurrency: ETH,
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  42161: {
    urls: ['https://arb1.arbitrum.io/rpc'].filter(Boolean),
    name: 'Arbitrum One',
    nativeCurrency: ETH,
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  137: {
    urls: ['https://polygon-rpc.com'].filter(Boolean),
    name: 'Polygon Mainnet',
    nativeCurrency: MATIC,
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  42220: {
    urls: ['https://forno.celo.org'],
    name: 'Celo',
    nativeCurrency: CELO,
    blockExplorerUrls: ['https://explorer.celo.org'],
  },
}

export const TESTNET_CHAINS: ChainConfig = {
  420: {
    urls: ['https://goerli.optimism.io'].filter(Boolean),
    name: 'Optimism Goerli',
    nativeCurrency: ETH,
    blockExplorerUrls: ['https://goerli-explorer.optimism.io'],
  },
  421613: {
    urls: ['https://goerli-rollup.arbitrum.io/rpc'].filter(Boolean),
    name: 'Arbitrum Goerli',
    nativeCurrency: ETH,
    blockExplorerUrls: ['https://testnet.arbiscan.io'],
  },
  44787: {
    urls: ['https://alfajores-forno.celo-testnet.org'],
    name: 'Celo Alfajores',
    nativeCurrency: CELO,
    blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org'],
  },
}

export const CHAINS: ChainConfig = {
  ...MAINNET_CHAINS,
  ...TESTNET_CHAINS,
}

export const URLS: { [chainId: number]: string[] } = Object.keys(CHAINS).reduce<{ [chainId: number]: string[] }>(
  (accumulator, chainId) => {
    const validURLs: string[] = CHAINS[Number(chainId)].urls

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    console.log("accumulator::" , )

    return accumulator
  },
  {}
)
