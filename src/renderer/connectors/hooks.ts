
import { hooks, network , web3Store } from './network'

export function useWeb3Hooks(){
  return hooks;
}

export function useWeb3Network(){
  return network;
}

export function useWeb3Store(){
  return web3Store;
}
