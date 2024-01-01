
import { useSelector } from 'react-redux'
import { AppState } from '../index';


export function useBlockNumber(): number {
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


