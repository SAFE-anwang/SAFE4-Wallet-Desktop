
import { useSelector } from 'react-redux'
import { AppState } from '../index';

export function useBlockNumber(): string {
  return useSelector((state: AppState) => {
    return state.application.blockNumber;
  });
}

export function useAccounts(): string[] {
  return useSelector((state: AppState) => {
    return state.application.accounts;
  })
}

export function useSysInfo(): {
  node_serve_path: string 
} {
  return useSelector((state: AppState) => {
    return state.application.sysInfo;
  })
}

export function useNewMnemonic() : string | undefined {
  return useSelector((state: AppState) => {
    return state.application.wallets.newMnemonic;
  })
}