import type { AddEthereumChainParameter } from '@web3-react/types'
import config from '../config'

const {Default_Web3_Endpoint} = config;

const BSC: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'BSC',
  symbol: 'BNB',
  decimals: 18,
}

const SAFE4: AddEthereumChainParameter['nativeCurrency'] = {
  name: 'SAFE4',
  symbol: 'SAFE',
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

type ChainConfig = { [chainId: number]: BasicChainInformation | ExtendedChainInformation }

export const MAINNET_CHAINS: ChainConfig = {
  // 56: {
  //   urls: ['https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3'].filter(Boolean),
  //   name: 'BNB',
  //   nativeCurrency: BSC,
  // },
}

export const TESTNET_CHAINS: ChainConfig = {
  6666666: {
    urls: [Default_Web3_Endpoint].filter(Boolean),
    name: 'SAFE4',
    nativeCurrency: SAFE4,
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
    return accumulator
  },
  {}
)
