import { Web3ReactHooks, initializeConnector } from '@web3-react/core'
import { Network } from '@web3-react/network'

import { URLS } from './chains'
import { Web3ReactStore } from '@web3-react/types'

export const [network, hooks , web3Store] = initializeConnector<Network>((actions) => new Network({ actions, urlMap: {
  6666666 : ["http://172.104.162.94:8545"]
}}))


export function initializeConnect( urlMap : { [chainId : number] : string[] } ) : [Network, Web3ReactHooks, Web3ReactStore] {
  return initializeConnector<Network>((actions) => new Network({ actions, urlMap}));
}
