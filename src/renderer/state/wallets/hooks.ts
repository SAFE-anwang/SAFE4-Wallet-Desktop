
import { useSelector } from 'react-redux'
import { AppState } from '../index';
import { Wallet, WalletKeystore } from './reducer';

export function useWalletsList(): Wallet[] {
  return useSelector((state: AppState) => {
    return state.wallets.list;
  });
}

export function useWalletsKeystores() : WalletKeystore[] {
  return useSelector((state: AppState) => {
    return state.wallets.keystores;
  });
}

export function useWalletsActiveWallet() : Wallet | undefined {
  return useSelector((state: AppState) => {
    return state.wallets.activeWallet;
  });
}

