
import { useSelector } from 'react-redux'
import { AppState } from '../index';

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

export function useActionAtCreateWallet(): boolean{
  return useSelector((state: AppState) => {
    return state.application.action.atCreateWallet;
  })
}

