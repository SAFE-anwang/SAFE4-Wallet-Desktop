
import { useSelector } from 'react-redux'
import { AppState } from '../index';
import { Wallet } from '../wallets/reducer';

export function useBlockNumber(): string {
  return useSelector((state: AppState) => {
    return state.application.blockchain.blockNumber;
  });
}

export function useNewMnemonic(): string | undefined {
  return useSelector((state: AppState) => {
    return state.application.action.newMnemonic;
  })
}

export function useApplicationActionAtCreateWallet(): boolean{
  return useSelector((state: AppState) => {
    return state.application.action.atCreateWallet;
  })
}

export function useApplicationBlockchainActiveWallet(): Wallet | undefined{
  return useSelector((state: AppState) => {
    return state.application.blockchain.activeWallet;
  })
}



