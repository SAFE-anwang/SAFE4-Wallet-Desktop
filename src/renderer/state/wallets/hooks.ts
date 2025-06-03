
import { CurrencyAmount, JSBI, Token, TokenAmount } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { useAccountManagerContract, useIERC20Contract, useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../hooks/useContracts';
import { isAddress } from '../../utils';
import { AppState } from '../index';
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../multicall/hooks';
import { ERC20Token, Wallet, WalletKeystore } from './reducer';
import { useBlockNumber } from '../application/hooks';
import { AccountRecord, IdPageQuery, formatAccountRecord, formatRecordUseInfo } from '../../structs/AccountManager';
import { useWeb3React } from '@web3-react/core';
import { IERC20_Interface } from '../../abis';
import { generateChildWalletsCheckResult, SupportChildWalletType } from '../../utils/GenerateChildWallet';
import { walletsUpdateWalletChildWallets } from './action';
import { Safe4NetworkChainId } from '../../config';

export function useWalletsList(): Wallet[] {
  return useSelector((state: AppState) => {
    return state.wallets.list;
  });
}

export function useWalletsWalletNames(): { [address in string]: { name: string, active: boolean } } | undefined {
  return useSelector((state: AppState) => {
    return state.wallets.walletNames;
  })
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

export function useWalletsActiveKeystore(): WalletKeystore | undefined {
  return useSelector((state: AppState) => {
    if (state.wallets.activeWallet) {
      return state.wallets.keystores.filter(
        walletKetstore => {
          return walletKetstore.publicKey == state.wallets.activeWallet?.publicKey
        }
      )[0];
    }
    return undefined;
  });
}

export function useWalletsActiveSigner(): ethers.Wallet | undefined {
  const { provider } = useWeb3React();
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
    total: { amount: CurrencyAmount, count: number },
    avaiable: { amount: CurrencyAmount, count: number },
    locked: { amount: CurrencyAmount, count: number },
    used: { amount: CurrencyAmount, count: number }
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
            count: number
          },
          avaiable: {
            amount: CurrencyAmount,
            count: number
          },
          locked: {
            amount: CurrencyAmount,
            count: number
          },
          used: {
            amount: CurrencyAmount,
            count: number
          },
        }
      }>((memo, address, i) => {

        memo[address] = memo[address] ?? {};
        const balance = balanceResults?.[i]?.result?.[0]
        if (balance) memo[address].balance = CurrencyAmount.ether(JSBI.BigInt(balance.toString()))

        memo[address].total = memo[address].total ?? {};
        const totalAmount = totalAmountResults?.[i]?.result?.[0];
        const totalCount = totalAmountResults?.[i]?.result?.[1];
        if (totalAmount) memo[address].total.amount = CurrencyAmount.ether(JSBI.BigInt(totalAmount.toString()))
        if (totalCount) memo[address].total.count = totalCount.toNumber();


        memo[address].avaiable = memo[address].avaiable ?? {};
        const avaiableAmount = availableAmountResults?.[i]?.result?.[0];
        const avaiableCount = availableAmountResults?.[i]?.result?.[1];
        if (avaiableAmount) memo[address].avaiable.amount = CurrencyAmount.ether(JSBI.BigInt(avaiableAmount.toString()));
        if (avaiableCount) memo[address].avaiable.count = avaiableCount.toNumber();

        memo[address].locked = memo[address].locked ?? {};
        const lockedAmount = lockedAmountResults?.[i]?.result?.[0];
        const lockedCount = lockedAmountResults?.[i]?.result?.[1];
        if (lockedAmount) memo[address].locked.amount = CurrencyAmount.ether(JSBI.BigInt(lockedAmount.toString()));
        if (lockedCount) memo[address].locked.count = lockedCount.toNumber();
        memo[address].used = memo[address].used ?? {};
        const usedAmount = uesdAmountResults?.[i]?.result?.[0];
        const usedCount = uesdAmountResults?.[i]?.result?.[1];
        if (usedAmount) memo[address].used.amount = CurrencyAmount.ether(JSBI.BigInt(usedAmount.toString()));
        if (usedCount) memo[address].used.count = usedCount.toNumber();
        return memo
      }, {}),
    [addresses, balanceResults, availableAmountResults, lockedAmountResults, uesdAmountResults]
  )
}

export function useActiveAccountAccountRecords() {
  const Get_Record_Account_ID_Page_Size = 50;
  const activeAccount = useWalletsActiveAccount();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const blockNumber = useBlockNumber();

  const [idPageQuery, setIdPageQuery] = useState<IdPageQuery[]>();
  const [accountRecordMap, setAccountRecordMap] = useState<{
    [id: string]: AccountRecord
  }>({});
  const [executeIdPageQuery, setExecuteIdPageQuery] = useState<IdPageQuery>();

  useEffect(() => {
    if (executeIdPageQuery && !executeIdPageQuery.result && accountManagerContract && multicallContract) {
      const getRecordByIDFragment = accountManagerContract?.interface?.getFunction("getRecordByID");
      const getRecordUseInfoFragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
      const ids: number[] | undefined = executeIdPageQuery.ids;
      if (ids) {
        const getRecordByIDCalls = [];
        const getRecordUseInfoCalls = [];
        for (let i = 0; i < ids.length; i++) {
          getRecordByIDCalls.push([
            accountManagerContract.address,
            accountManagerContract?.interface.encodeFunctionData(getRecordByIDFragment, [ids[i]])
          ]);
          getRecordUseInfoCalls.push([
            accountManagerContract.address,
            accountManagerContract?.interface.encodeFunctionData(getRecordUseInfoFragment, [ids[i]])
          ]);
        }

        multicallContract.callStatic.aggregate(getRecordByIDCalls.concat(getRecordUseInfoCalls))
          .then(data => {
            const raws = data[1];
            const half = raws.length / 2;
            const accountRecords: AccountRecord[] = [];
            for (let i = half - 1; i >= 0; i--) {
              const _accountRecord = accountManagerContract?.interface.decodeFunctionResult(getRecordByIDFragment, raws[i])[0];
              const _recordUseInfo = accountManagerContract?.interface.decodeFunctionResult(getRecordUseInfoFragment, raws[half + i])[0];
              const accountRecord = formatAccountRecord(_accountRecord);
              accountRecord.recordUseInfo = formatRecordUseInfo(_recordUseInfo);
              accountRecords.push(accountRecord);
            }
            setExecuteIdPageQuery({
              ...executeIdPageQuery,
              result: accountRecords
            });
            accountRecords.forEach(accountRecord => {
              accountRecordMap[accountRecord.id] = accountRecord;
            });
            setAccountRecordMap({
              ...accountRecordMap
            })
          })

      } else {
        setExecuteIdPageQuery({
          ...executeIdPageQuery,
          result: []
        })
      }
    }
  }, [executeIdPageQuery]);

  useEffect(() => {
    if (idPageQuery && accountManagerContract) {
      for (let i in idPageQuery) {
        if (!idPageQuery[i].ids) return;
      }
      if (executeIdPageQuery) {
        if (executeIdPageQuery.result && executeIdPageQuery.position != 0) {
          const next = idPageQuery.filter(query => query.position == executeIdPageQuery.position - Get_Record_Account_ID_Page_Size)[0];
          setExecuteIdPageQuery(next);
        } else {
          return;
        }
      } else {
        console.log("setExecuteIdPageQuery ::", idPageQuery)
        setExecuteIdPageQuery(idPageQuery[idPageQuery.length - 1])
      }
    }
  }, [idPageQuery, executeIdPageQuery]);

  useEffect(() => {
    if (accountManagerContract) {
      // function getTotalAmount(address _addr) external view returns (uint, uint);
      accountManagerContract.callStatic.getTotalAmount(activeAccount)
        .then(data => {
          const totalCount = data[1].toNumber();
          if (totalCount == 0) return
          setIdPageQuery(undefined);
          setExecuteIdPageQuery(undefined);
          const idPages = Math.ceil(totalCount / Get_Record_Account_ID_Page_Size);
          const idPageQuery: { position: number, offset: number, ids?: number[] }[] = [];
          for (let i = 0; i < idPages; i++) {
            idPageQuery.push({
              position: i * Get_Record_Account_ID_Page_Size,
              offset: Get_Record_Account_ID_Page_Size
            })
          }
          const getTotalIDsFragment = accountManagerContract?.interface?.getFunction("getTotalIDs");
          const getTotalIds_calls = idPageQuery.map(({ position, offset }) => {
            return {
              address: accountManagerContract?.address,
              callData: accountManagerContract?.interface.encodeFunctionData(getTotalIDsFragment, [activeAccount, position, offset])
            }
          });
          if (multicallContract) {
            multicallContract.callStatic.aggregate(getTotalIds_calls.map(call => [call.address, call.callData]))
              .then((data) => {
                const _blockNumber = data[0].toNumber();
                for (let i = 0; i < data[1].length; i++) {
                  const _ids = accountManagerContract?.interface.decodeFunctionResult(getTotalIDsFragment, data[1][i])[0];
                  const ids: number[] = [];
                  for (let j in _ids) {
                    ids.push(_ids[j].toNumber());
                  }
                  idPageQuery[i].ids = ids;
                }
                console.log("first count idPageQuery >>", totalCount, idPageQuery)
                setIdPageQuery(idPageQuery);
              })
          }
        })
    }
  }, [blockNumber, activeAccount]);
  useEffect(() => {
    setAccountRecords(
      Object.keys(accountRecordMap)
        .sort((id0, id1) => Number(id1) - Number(id0))
        .filter(id => accountRecordMap[id].addr == activeAccount)
        .map(id => accountRecordMap[id])
    )
  }, [accountRecordMap, activeAccount])

  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);

  return accountRecords;
}



/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )
  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])
  const balances = useMultipleContractSingleData(validatedTokenAddresses, IERC20_Interface, 'balanceOf', [address])
  const anyLoading: boolean = useMemo(() => balances.some(callState => callState.loading), [balances])
  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = new TokenAmount(token, amount)
            }
            return memo
          }, {})
          : {},
      [address, validatedTokens, balances]
    ),
    anyLoading
  ]
}

export function useTokenAllowanceWithLoadingIndicator(
  address?: string,
  spender?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )
  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])
  const balances = useMultipleContractSingleData(validatedTokenAddresses, IERC20_Interface, 'allowance', [address, spender]);
  const anyLoading: boolean = useMemo(() => balances.some(callState => callState.loading), [balances])
  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = new TokenAmount(token, amount)
            }
            return memo
          }, {})
          : {},
      [address, validatedTokens, balances]
    ),
    anyLoading
  ]
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

export function useTokenAllowanceAmounts(
  address?: string,
  spender?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenAllowanceWithLoadingIndicator(address, spender, tokens)[0]
}


export function useTokenAllowance(token: Token, owner: string, spender: string) {
  const ERC20_Contract = useIERC20Contract(token.address, false);
  const allowance = useSingleContractMultipleData(
    ERC20_Contract,
    'allowance',
    [[owner, spender]]
  );
  return allowance[0].result ? new TokenAmount(token, JSBI.BigInt(allowance[0].result?.toString())) : undefined;
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return
  return tokenBalances[token.address]
}

/**
 *
 * @param type mn | sn
 */
export function useActiveAccountChildWallets(type: SupportChildWalletType , initSize ?: number) {
  // 每一批检查多少个子钱包
  const size = initSize ? initSize : 50;
  const activeAccountKeystore = useWalletsActiveKeystore();
  if (!activeAccountKeystore) {
    return;
  }
  const { chainId } = useWeb3React();
  const multicall = useMulticallContract();
  const supernodeContract = useSupernodeStorageContract();
  const masternodeContract = useMasternodeStorageContract();
  const dispatch = useDispatch();

  const childTypeWallets = useSelector((state: AppState) => {
    return SupportChildWalletType.SN == type ? state.wallets.walletChildWallets[activeAccountKeystore.address]?.sn
      : state.wallets.walletChildWallets[activeAccountKeystore.address]?.mn
  });
  const walletUsedAddressed = useSelector((state: AppState) => {
    return state.wallets.walletUsedAddress;
  });
  const nodeStorageContract = SupportChildWalletType.SN == type ? supernodeContract : masternodeContract;

  useEffect(() => {
    if (activeAccountKeystore.mnemonic && multicall && nodeStorageContract) {
      let _notExistCount = (childTypeWallets && childTypeWallets.wallets) ?
        Object.keys(childTypeWallets.wallets)
          .map(childAddress => childTypeWallets.wallets[childAddress].exist || walletUsedAddressed.indexOf(childAddress) > 0 ? 0 : 1)
          .reduce((a: number, b: number) => (a + b), 0)
        : 0;
      let _startAddressIndex = (childTypeWallets && childTypeWallets.wallets) ? Object.keys(childTypeWallets.wallets).length : 0;
      if (!childTypeWallets || childTypeWallets.loading) {
        generateChildWalletsCheckResult(
          activeAccountKeystore.mnemonic, activeAccountKeystore.password ? activeAccountKeystore.password : "",
          _startAddressIndex, size,
          nodeStorageContract, multicall,
          (err, result) => {
            if (err) {
              dispatch(walletsUpdateWalletChildWallets({
                address: activeAccountKeystore.address,
                type,
                loading: false
              }));
              return;
            }
            const payloadMap: {
              [address: string]: {
                exist: boolean,
                path: string,
                privateKey: string
              }
            } = {};
            let notExistCount = 0;
            Object.keys(result.map).forEach(address => {
              notExistCount += result.map[address].exist || walletUsedAddressed.indexOf(address) >= 0 ? 0 : 1;
              payloadMap[address] = {
                exist: result.map[address].exist || walletUsedAddressed.indexOf(address) >= 0,
                path: result.map[address].hdNode.path,
                privateKey: result.map[address].hdNode.privateKey,
              }
            });
            // 判断是否需要继续加载子钱包并验证 loading;
            const loading = (notExistCount + _notExistCount) < size / 2;
            console.log("need loading ?? >> ", (notExistCount + _notExistCount), loading)
            dispatch(walletsUpdateWalletChildWallets({
              address: activeAccountKeystore.address,
              type,
              loading,
              result: {
                map: payloadMap
              }
            }));
          });
      } else {
        // 随着用户的使用,导致当前列表的可使用数量低于 size 时,变更状态让它继续加载可用子钱包;
        if (_notExistCount < size / 2) {
          console.log("通知需要更新:: >>", _notExistCount)
          dispatch(walletsUpdateWalletChildWallets({
            address: activeAccountKeystore.address,
            type,
            loading: true
          }));
        } else {
          // 判断是否有当前建立的,但是链上还没有更新的exist状态;
          const _map: {
            [address: string]: { exist: boolean, path: string , privateKey : string }
          } = {}
          Object.keys(childTypeWallets.wallets)
            .filter(childAddress => !childTypeWallets.wallets[childAddress].exist && walletUsedAddressed.indexOf(childAddress) >= 0)
            .forEach(childAddress => {
              _map[childAddress] = { exist: true, path: childTypeWallets.wallets[childAddress].path , privateKey : childTypeWallets.wallets[childAddress].privateKey }
            })
          if (Object.keys(_map).length > 0) {
            dispatch(walletsUpdateWalletChildWallets({
              address: activeAccountKeystore.address,
              type,
              loading: false,
              result: { map: _map }
            }));
          }
        }
      }
    }
  }, [childTypeWallets, multicall, nodeStorageContract, activeAccountKeystore, walletUsedAddressed, chainId])
  return childTypeWallets;
}


