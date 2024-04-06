
import { useSelector } from 'react-redux'
import { AppState } from '../index';
import { AfterSetPasswordTODO } from './reducer';


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

export function useApplicationBlockchainWeb3Rpc() : { endpoint : string , chainId : number } {
  return useSelector((state: AppState) => {
    return state.application.blockchain.web3rpc;
  })
}

export function hasApplicationPasswordSetted() : boolean {
  return useSelector((state: AppState) => {
    return state.application.encrypt?.password ? true : false;
  })
}

export function useApplicationAfterSetPasswordTODO() : AfterSetPasswordTODO {
  return useSelector((state: AppState) => {
    return state.application.action.afterSetPasswordTODO;
  })
}

export function useApplicationPassword() : string | undefined {
  return useSelector((state: AppState) => {
    return state.application.encrypt?.password;
  })
}


