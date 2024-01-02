
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useMemo } from 'react';
import { useSelector } from 'react-redux'
import { useWeb3Hooks } from '../../connectors/hooks';
import { useMulticallContract } from '../../hooks/useContracts';
import { isAddress } from '../../utils';
import { AppState } from '../index';
import { useSingleContractMultipleData } from '../multicall/hooks';
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

export function useWalletsActiveWallet() : Wallet | null {
  return useSelector((state: AppState) => {
    return state.wallets.activeWallet;
  });
}

export function useWalletsActiveAccount() : string {
  return useSelector((state: AppState) => {
    return state.wallets.activeWallet ? state.wallets.activeWallet.address : "";
  });
}

export function useWalletsActivePrivateKey() : string {
  return useSelector((state: AppState) => {
    const privateKey = state.wallets.keystores.filter(
      walletKetstore => walletKetstore.publicKey == state.wallets.activeWallet?.publicKey
    )[0].privateKey;
    return privateKey;
  });
}

export function useWalletsActiveSigner() : ethers.Wallet {
  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const activePrivateKey = useWalletsActivePrivateKey();
  return new ethers.Wallet(activePrivateKey , provider);
}

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
 export function useETHBalances(
  uncheckedAddresses?: (string | undefined)[]
): { [address: string]: CurrencyAmount | undefined } {
  const multicallContract = useMulticallContract()

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const results = useSingleContractMultipleData(
    multicallContract,
    'getEthBalance',
    addresses.map(address => [address])
  )

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: CurrencyAmount }>((memo, address, i) => {
        const value = results?.[i]?.result?.[0]
        if (value) memo[address] = CurrencyAmount.ether(JSBI.BigInt(value.toString()))
        return memo
      }, {}),
    [addresses, results]
  )
}

