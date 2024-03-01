
import { useSelector } from 'react-redux'
import { AppState } from '../index';


export function useBlockNumber(): number {
  return useSelector((state: AppState) => {
    return state.application.blockchain.blockNumber;
  });
}

export function useTimestamp(): number {
  return useSelector((state: AppState) => {
    return state.application.blockchain.timestamp;
  });
}

export function useNewMnemonic(): string | undefined {
  return useSelector((state: AppState) => {
    return state.application.action.newMnemonic;
  })
}

export function useImportWalletParams(): {
  importType: string,
  mnemonic?: string,
  password?: string,
  path?: string,
  privateKey?: string,
  address?: string
} | undefined {
  return useSelector((state: AppState) => {
    return state.application.action.importWallet;
  })
}

export function useApplicationActionAtCreateWallet(): boolean {
  return useSelector((state: AppState) => {
    return state.application.action.atCreateWallet;
  })
}


