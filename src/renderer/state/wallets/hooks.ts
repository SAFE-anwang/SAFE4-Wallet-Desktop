
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux'
import { useWeb3Hooks } from '../../connectors/hooks';
import { useAccountManagerContract, useMulticallContract } from '../../hooks/useContracts';
import { isAddress } from '../../utils';
import { AppState } from '../index';
import { useSingleContractMultipleData } from '../multicall/hooks';
import { Wallet, WalletKeystore } from './reducer';
import { useBlockNumber } from '../application/hooks';
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from '../../structs/AccountManager';

export function useWalletsList(): Wallet[] {
  return useSelector((state: AppState) => {
    return state.wallets.list;
  });
}

export function useWalletsKeystores(): WalletKeystore[] {
  return useSelector((state: AppState) => {
    return state.wallets.keystores;
  });
}

export function useWalletsActiveWallet(): Wallet | null {
  return useSelector((state: AppState) => {
    return state.wallets.activeWallet;
  });
}

export function useWalletsActiveAccount(): string {
  return useSelector((state: AppState) => {
    return state.wallets.activeWallet ? state.wallets.activeWallet.address : "";
  });
}

export function useWalletsActivePrivateKey(): string | undefined {
  return useSelector((state: AppState) => {
    if (state.wallets.activeWallet) {
      return state.wallets.keystores.filter(
        walletKetstore => {
          return walletKetstore.publicKey == state.wallets.activeWallet?.publicKey
        }
      )[0].privateKey
    }
    return undefined;
  });
}

export function useWalletsActiveSigner(): ethers.Wallet | undefined {
  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const activePrivateKey = useWalletsActivePrivateKey();
  return activePrivateKey ? new ethers.Wallet(activePrivateKey, provider) : undefined;
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

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useSafe4Balance(
  uncheckedAddresses?: (string | undefined)[]
): {
  [address: string]: {
    balance: CurrencyAmount,
    total: { amount: CurrencyAmount, ids: string[] },
    avaiable: { amount: CurrencyAmount, ids: string[] },
    locked: { amount: CurrencyAmount, ids: string[] },
    used: { amount: CurrencyAmount, ids: string[] }
  } | undefined
} {

  const multicallContract = useMulticallContract();
  const accountManagerContract = useAccountManagerContract();

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

  const balanceResults = useSingleContractMultipleData(
    multicallContract,
    'getEthBalance',
    addresses.map(address => [address])
  );

  const totalAmountResults = useSingleContractMultipleData(
    accountManagerContract,
    'getTotalAmount',
    addresses.map(address => [address])
  );
  const availableAmountResults = useSingleContractMultipleData(
    accountManagerContract,
    'getAvailableAmount',
    addresses.map(address => [address])
  );
  const lockedAmountResults = useSingleContractMultipleData(
    accountManagerContract,
    'getLockedAmount',
    addresses.map(address => [address])
  );
  const uesdAmountResults = useSingleContractMultipleData(
    accountManagerContract,
    'getUsedAmount',
    addresses.map(address => [address])
  );

  return useMemo(
    () =>
      addresses.reduce<{
        [address: string]: {
          balance: CurrencyAmount,
          total: {
            amount: CurrencyAmount,
            ids: string[]
          },
          avaiable: {
            amount: CurrencyAmount,
            ids: string[]
          },
          locked: {
            amount: CurrencyAmount,
            ids: string[]
          },
          used: {
            amount: CurrencyAmount,
            ids: string[]
          },
        }
      }>((memo, address, i) => {

        memo[address] = memo[address] ?? {};
        const balance = balanceResults?.[i]?.result?.[0]
        if (balance) memo[address].balance = CurrencyAmount.ether(JSBI.BigInt(balance.toString()))

        memo[address].total = memo[address].total ?? {};
        const totalAmount = totalAmountResults?.[i]?.result?.[0];
        const totalIds = totalAmountResults?.[i]?.result?.[1];
        if (totalAmount) memo[address].total.amount = CurrencyAmount.ether(JSBI.BigInt(totalAmount.toString()))
        if (totalIds) memo[address].total.ids = totalIds.map((id: any) => JSBI.BigInt(id).toString());

        memo[address].avaiable = memo[address].avaiable ?? {};
        const avaiableAmount = availableAmountResults?.[i]?.result?.[0];
        const avaiableIds = availableAmountResults?.[i]?.result?.[1];
        if (avaiableAmount) memo[address].avaiable.amount = CurrencyAmount.ether(JSBI.BigInt(avaiableAmount.toString()));
        if (avaiableIds) memo[address].avaiable.ids = avaiableIds.map((id: any) => JSBI.BigInt(id).toString());

        memo[address].locked = memo[address].locked ?? {};
        const lockedAmount = lockedAmountResults?.[i]?.result?.[0];
        const lockedIds = lockedAmountResults?.[i]?.result?.[1];
        if (lockedAmount) memo[address].locked.amount = CurrencyAmount.ether(JSBI.BigInt(lockedAmount.toString()));
        if (lockedIds) memo[address].locked.ids = lockedIds.map((id: any) => JSBI.BigInt(id).toString());

        memo[address].used = memo[address].used ?? {};
        const usedAmount = uesdAmountResults?.[i]?.result?.[0];
        const usedIds = uesdAmountResults?.[i]?.result?.[1];
        if (usedAmount) memo[address].used.amount = CurrencyAmount.ether(JSBI.BigInt(usedAmount.toString()));
        if (usedIds) memo[address].used.ids = usedIds.map((id: any) => JSBI.BigInt(id).toString());

        return memo
      }, {}),
    [addresses, balanceResults, availableAmountResults, lockedAmountResults, uesdAmountResults]
  )
}

export function useActiveAccountAccountRecords() {
  const activeAccount = useWalletsActiveAccount();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);
  useEffect(() => {
    if (accountManagerContract) {
      accountManagerContract.callStatic
        .getRecords(activeAccount)
        .then(_accountRecords => {
          const accountRecords: AccountRecord[] = _accountRecords.map(formatAccountRecord);
          const fragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
          if (accountRecords.length > 0 && fragment && multicallContract) {
            const calls = accountRecords.map(accountRecord => {
              return {
                address: accountManagerContract?.address,
                callData: accountManagerContract?.interface.encodeFunctionData(fragment, [accountRecord.id])
              }
            });
            multicallContract.callStatic.aggregate(calls.map(call => [call.address, call.callData]))
              .then((data) => {
                const _blockNumber = data[0].toNumber();
                for (let i = 0; i < data[1].length; i++) {
                  const _recordUserInfo = accountManagerContract?.interface.decodeFunctionResult(fragment, data[1][i])[0];
                  accountRecords[i].recordUseInfo = formatRecordUseInfo(_recordUserInfo);
                }
                setAccountRecords(accountRecords.filter(accountRecord => accountRecord.id != 0));
              })
          } else {
            setAccountRecords([]);
          }
        })
    }
  }, [activeAccount, accountManagerContract]);
  return accountRecords;
}

