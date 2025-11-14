import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "..";
import { useCallback, useMemo } from "react";
import { addTransaction } from "./actions";
import { Transfer, TransactionDetails, ContractCall, TokenTransfer } from "./reducer";
import { DateFormat } from "../../utils/DateUtils";
import { ChainId, CurrencyAmount, JSBI, Token } from "@uniswap/sdk";
import { CrossChainVO, DateTimeNodeRewardVO, TimeNodeRewardVO } from "../../services";
import { useWeb3React } from "@web3-react/core";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config";
import { useWalletsActiveAccount } from "../wallets/hooks";

export function useTransactionAdder2(): (
  response: {
    from: string,
    to: string,
    hash: string,
    chainId: number,
  },
  customData?: {
    transfer?: Transfer,
    call?: ContractCall,
    withdrawAmount?: string
  }
) => void {
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    (
      response: {
        from: string,
        to: string,
        hash: string,
        chainId: number
      },
      { transfer, call, withdrawAmount }:
        {
          transfer?: Transfer,
          call?: ContractCall,
          withdrawAmount?: string
        } = {}
    ) => {
      const { from, hash, chainId } = response;
      const { to } = transfer ? { ...transfer } :
        call ? { ...call }
          : { to: undefined };
      const transaction = {
        hash,
        chainId,
        refFrom: from,
        refTo: to,
        transfer,
        call,
        withdrawAmount
      }
      dispatch(addTransaction(transaction));
    },
    [dispatch]
  )
}

export function useTransactionAdder(): (
  request: TransactionRequest,
  response: TransactionResponse,
  customData?: {
    transfer?: Transfer,
    call?: ContractCall,
    withdrawAmount?: string
  }
) => void {
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(
    (
      request: TransactionRequest,
      response: TransactionResponse,
      { transfer, call, withdrawAmount }:
        {
          transfer?: Transfer,
          call?: ContractCall,
          withdrawAmount?: string
        } = {}
    ) => {
      const { from, hash } = response;
      // 如果是普通转账则为到账地址
      // 如果是代币转账,则显示为transfer(to,value)中的到账地址
      // 如果是合约调用,则显示为合约地址
      const { to } =
        transfer ? { ...transfer } :
          call ? { ...call }
            : { to: undefined }
      const transaction = {
        hash,
        refFrom: from,
        chainId: response.chainId,
        refTo: to,
        transfer,
        call,
        withdrawAmount
      }
      dispatch(addTransaction(transaction));
    },
    [dispatch]
  )
}

export function useTransactions(account?: string) {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  const nodeRewards = useSelector((state: AppState) => state.transactions.nodeRewards);
  const { chainId } = useWeb3React();
  const accountTransactions = useMemo(() => {
    return Object.keys(transactions)
      .filter(txHash => {
        const transaction = transactions[txHash];
        const { refFrom, refTo } = transaction;
        return refFrom == account || refTo == account;
      })
      .map(txHash => {
        return transactions[txHash];
      })
      .sort((t0, t1) => {
        return t1.addedTime - t0.addedTime
      })
  }, [account, transactions, chainId]);
  const dateTransactions: {
    [date: string]: {
      transactions: TransactionDetails[],
      systemRewardAmount: CurrencyAmount
    }
  } = {};

  accountTransactions.forEach(transaction => {
    const date = transaction.timestamp ? transaction.timestamp : transaction.addedTime;
    const dateKey = DateFormat(date);
    dateTransactions[dateKey] = dateTransactions[dateKey] ?? {
      transactions: [],
      systemRewardAmount: CurrencyAmount.ether(JSBI.BigInt(0))
    };
    if (transaction.systemRewardDatas) {
      Object.keys(transaction.systemRewardDatas)
        .forEach(eventLogIndex => {
          if (transaction.systemRewardDatas) {
            const { amount } = transaction.systemRewardDatas[eventLogIndex];
            const _amount = CurrencyAmount.ether(JSBI.BigInt(amount));
            dateTransactions[dateKey].systemRewardAmount = dateTransactions[dateKey].systemRewardAmount.add(_amount);
          }
        })
    } else {
      dateTransactions[dateKey].transactions.push(transaction);
    }
  });
  if (nodeRewards && account && nodeRewards[account]) {
    if (nodeRewards[account] instanceof Array) {
      nodeRewards[account].forEach((nodeReward: DateTimeNodeRewardVO) => {
        const { amount, date } = nodeReward;
        const dateKey = date;
        const _amount = CurrencyAmount.ether(JSBI.BigInt(amount));
        if (!dateTransactions[dateKey]) {
          dateTransactions[dateKey] = {
            transactions: [],
            systemRewardAmount: CurrencyAmount.ether(JSBI.BigInt(0))
          };
        }
        dateTransactions[dateKey].systemRewardAmount = _amount;
      })
    }
  }
  return dateTransactions;
}

export function useTransaction(hash: string): TransactionDetails {
  const transactions = useSelector((state: AppState) => state.transactions.transactions);
  return transactions[hash];
}

export function useTokens(): { [address: string]: { name: string, symbol: string, decimals: number, chainId: number } } {
  return useSelector((state: AppState) => state.transactions.tokens);
}

export function useCrosschain(srcTxHash: string): CrossChainVO | undefined {
  return useSelector((state: AppState) => state.transactions.crosschains[srcTxHash]);
}

export function useCrosschains(): { [srxTxHash: string]: CrossChainVO } {
  return useSelector((state: AppState) => state.transactions.crosschains);
}

// export function useERC20Tokens(chainId: Safe4NetworkChainId): Token[] {
//   return useSelector((state: AppState) => {
//     const defaultTokenAddresses: { [address: string]: Token } = {};
//     defaultTokenAddresses[USDT[chainId as Safe4NetworkChainId].address] = USDT[chainId as Safe4NetworkChainId];
//     defaultTokenAddresses[WSAFE[chainId as Safe4NetworkChainId].address] = WSAFE[chainId as Safe4NetworkChainId];
//     const defaultTokens = Object.keys(defaultTokenAddresses).map(address => defaultTokenAddresses[address]);
//     const walletTokens = Object.keys(state.transactions.tokens)
//       .filter(address => {
//         return state.transactions.tokens[address].chainId == chainId
//           && defaultTokenAddresses[address] == undefined
//       })
//       .map(address => {
//         const { name, symbol, decimals } = state.transactions.tokens[address];
//         const token = new Token(
//           ChainId.MAINNET,
//           address, decimals,
//           symbol, name
//         );
//         return token;
//       });
//     return defaultTokens.concat(walletTokens);
//   });
// }

export function useWalletTokens(): Token[] | undefined {
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const defaultTokens = useMemo(() => {
    if (!chainId) return [];
    return [
      WSAFE[chainId as Safe4NetworkChainId],
      USDT[chainId as Safe4NetworkChainId],
    ];
  }, [chainId]);
  const defaultTokenMap = useMemo(() => {
    const map: Record<string, Token> = {};
    for (const token of defaultTokens) {
      map[token.address] = token;
    }
    return map;
  }, [defaultTokens]);
  const _walletTokens = useSelector((state: AppState) => state.transactions.tokens);
  const _auditTokens = useSelector((state: AppState) =>
    chainId ? state.audit.tokens[chainId] : []
  );
  const _auditTokensMap = useMemo(() => {
    return _auditTokens && _auditTokens.reduce((map, token) => {
      map[token.address] = token;
      return map;
    }, {} as { [address: string]: any });
  }, [_auditTokens]);
  const extraTokens = useMemo(() => {
    if (!chainId || !_walletTokens) return [];
    return Object.keys(_walletTokens)
      .filter(address => {
        if (_walletTokens[address].chainId === chainId
          && defaultTokenMap[address] === undefined) {
          if (_walletTokens[address].props) {
            const props = JSON.parse(_walletTokens[address].props);
            return !props.hide;
          }
          if (_auditTokensMap && _auditTokensMap[address]) {
            return (
              _auditTokensMap[address].logoURI
              || _auditTokensMap[address].creator == activeAccount
            )
          }
          return false;
        }
        return false;
      })
      .map(address => {
        const { name, symbol, decimals, props } = _walletTokens[address];
        return new Token(chainId, address, decimals, symbol, name);
      });
  }, [_walletTokens, chainId, defaultTokenMap, _auditTokensMap]);
  return [...defaultTokens, ...extraTokens];
}



