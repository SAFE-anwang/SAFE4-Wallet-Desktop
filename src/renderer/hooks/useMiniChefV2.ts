import { useEffect, useMemo, useState } from 'react';
import { useBlockNumber } from '../state/application/hooks';
import { useMiniChefV2, useMulticallContract } from "./useContracts";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from '../state/multicall/CallMulticallAggregate';
import { BigNumber, Contract } from 'ethers';
import useSafeswapV2Pairs from './useSafeswapV2Pairs';
import { getPairCallResults, PairResult } from '../pages/main/safeswap/hooks';
import { useTokenBalances, useWalletsActiveAccount } from '../state/wallets/hooks';
import { useWeb3React } from '@web3-react/core';
import { useWalletTokens } from '../state/transactions/hooks';
import { useAuditTokenList } from '../state/audit/hooks';
import { ChainId, Pair, Token, TokenAmount } from '@uniswap/sdk';
import { IERC20_Interface } from '../abis';
import { Safe4NetworkChainId } from '../config';

/**
    /// @notice Info of each MCV2 pool.
    /// `allocPoint` The amount of allocation points assigned to the pool.
    /// Also known as the amount of SUSHI to distribute per block.
    struct PoolInfo {
        uint128 accSushiPerShare;
        uint64 lastRewardTime;
        uint64 allocPoint;
    }
 */
export interface MiniChefV2PoolInfo {
  lpToken: string,
  rewarder: string,
  accSushiPerShare: BigNumber,
  lastRewardTime: BigNumber,
  allocPoint: BigNumber,
  userInfo: {
    amount: BigNumber,
    rewardDebt: BigNumber
  },
  pendingSushi: BigNumber,
  pid: number,
  lpTokenBalance?: BigNumber
}

export interface Farm {
  SUSHI: string,
  SUSHI_Balance: BigNumber,
  SUSHI_Token: Token,

  sushiPerSecond: BigNumber,
  owner: string,
  poolLength: number,
  totalAllocPoint: BigNumber,
}

export interface MiniChefV2PoolInfoWithSafeswapPair {
  poolInfo: MiniChefV2PoolInfo,
  pairResult: PairResult,
  pair: Pair
}

export function useMiniChefV2PoolInfos() {
  const activeAccount = useWalletsActiveAccount();
  const multicall = useMulticallContract();
  const MiniChefV2 = useMiniChefV2();
  const blockNumber = useBlockNumber();
  const { provider } = useWeb3React();
  const [poolInfos, setPoolInfos] = useState<{
    farm: Farm,
    pools: MiniChefV2PoolInfo[],
  }>();
  const [loading, setLoading] = useState<boolean>(false);
  const walletTokens = useWalletTokens();

  useEffect(() => {
    if (multicall && MiniChefV2 && provider) {
      const loadMiniChefV2PoolInfos = async () => {
        setLoading(true);
        const miniChefV2_BaseInfo_Calls: CallMulticallAggregateContractCall[] = [];
        const SUSHI_Call: CallMulticallAggregateContractCall = {
          contract: MiniChefV2,
          functionName: "SUSHI",
          params: [],
        };
        const SUSHI_Persecond_Call: CallMulticallAggregateContractCall = {
          contract: MiniChefV2,
          functionName: "sushiPerSecond",
          params: []
        };
        const Owner_Call: CallMulticallAggregateContractCall = {
          contract: MiniChefV2,
          functionName: "owner",
          params: []
        };
        const PoolLength_Call: CallMulticallAggregateContractCall = {
          contract: MiniChefV2,
          functionName: "poolLength",
          params: []
        };
        const TotalAllocPoint_Call: CallMulticallAggregateContractCall = {
          contract: MiniChefV2,
          functionName: "totalAllocPoint",
          params: []
        };

        miniChefV2_BaseInfo_Calls.push(
          SUSHI_Call, SUSHI_Persecond_Call, Owner_Call, PoolLength_Call, TotalAllocPoint_Call
        )
        await SyncCallMulticallAggregate(multicall, miniChefV2_BaseInfo_Calls);

        const SUSHI = SUSHI_Call.result;
        const owner = Owner_Call.result;
        const poolLength = PoolLength_Call.result.toNumber();
        const sushiPerSecond = SUSHI_Persecond_Call.result;
        const totalAllocPoint = TotalAllocPoint_Call.result;

        const calls: CallMulticallAggregateContractCall[] = [];
        for (let i = 0; i < poolLength; i++) {
          calls.push({
            contract: MiniChefV2,
            functionName: "lpToken",
            params: [i],
          });
          calls.push({
            contract: MiniChefV2,
            functionName: "poolInfo",
            params: [i],
          });
          calls.push({
            contract: MiniChefV2,
            functionName: "rewarder",
            params: [i],
          });
          calls.push({
            contract: MiniChefV2,
            functionName: "userInfo",
            params: [i, activeAccount],
          });
          calls.push({
            contract: MiniChefV2,
            functionName: "pendingSushi",
            params: [i, activeAccount],
          });
        }
        console.log("Query MiniChefV2 [lpToken , poolInfo , rewarder , userInfo];")
        await SyncCallMulticallAggregate(multicall, calls);
        const poolInfos: MiniChefV2PoolInfo[] = [];
        for (let i = 0; i < calls.length / 5; i++) {
          const index = i * 5;
          const lpToken = calls[index].result;
          const [
            accSushiPerShare,       // How many allocation points assigned to this pool. SUSHI to distribute per block.
            lastRewardTime,         // Last block number that SUSHI distribution occurs.
            allocPoint              // Accumulated SUSHI per share, times 1e12. See below.
          ] = calls[index + 1].result;
          const rewarder = calls[index + 2].result;
          const { amount, rewardDebt } = calls[index + 3].result;
          const pendingSushi = calls[index + 4].result
          const userInfo = {
            amount, rewardDebt
          };
          const pid = i;
          const poolInfo = {
            lpToken, allocPoint, lastRewardTime, accSushiPerShare, rewarder, userInfo, pendingSushi, pid
          }
          poolInfos.push(poolInfo);
        }

        // 查询 MiniChefV2 上存入的 SUSHI-balance
        const SUSHI_balance_call: CallMulticallAggregateContractCall[] = []
        SUSHI_balance_call.push({
          contract: new Contract(SUSHI, IERC20_Interface, provider),
          functionName: "balanceOf",
          params: [MiniChefV2.address],
        });
        await SyncCallMulticallAggregate(multicall, SUSHI_balance_call);
        const SUSHI_Balance = SUSHI_balance_call[0].result;

        let SUSHI_Token = new Token(
          ChainId.MAINNET,
          SUSHI,
          18
        );;
        if (walletTokens) {
          let SUSHI_Token_Find = walletTokens.find((token) => {
            return token.address == SUSHI;
          });
          if (SUSHI_Token_Find) {
            SUSHI_Token = SUSHI_Token_Find;
          }
        }
        const farm: Farm = {
          SUSHI, owner, poolLength, sushiPerSecond, totalAllocPoint, SUSHI_Balance, SUSHI_Token
        }
        setPoolInfos({
          farm,
          pools: poolInfos
        });
        setLoading(false);
      }
      loadMiniChefV2PoolInfos();
    }
  }, [blockNumber, multicall, MiniChefV2, activeAccount]);
  return {
    poolInfos, loading
  };
}

export function useMiniChefV2PoolInfosFilterSafeswap() {
  const miniChefV2Contract = useMiniChefV2();
  const safeswapPairs = useSafeswapV2Pairs();

  const _result = useMiniChefV2PoolInfos();
  const result = _result.poolInfos;
  const loading = _result.loading;
  const [loading2, setLoading] = useState<boolean>(false);

  // 过滤在 Safeswap中的 LP 代币;
  const lpTokenPoolInfos = useMemo(() => {
    if (safeswapPairs && result?.pools) {
      return result.pools.filter(poolInfo => safeswapPairs.includes(poolInfo.lpToken));
    }
    return undefined;
  }, [safeswapPairs, result]);
  const farm = result?.farm;

  const activeAccount = useWalletsActiveAccount();
  const { provider } = useWeb3React();
  const multicallContract = useMulticallContract();

  const walletTokens = useWalletTokens();
  const auditTokens = useAuditTokenList();
  const erc20Tokens = useMemo(() => {
    const tokens = walletTokens && walletTokens.filter(token => {
      return token.name != 'Safeswap V2'
    });
    if (auditTokens) {
      const auditMap = auditTokens.reduce((map, token) => {
        map[token.address] = token;
        return map;
      }, {} as { [address: string]: any })
      return tokens?.filter(token => auditMap[token.address] != undefined)
    }
    return tokens;
  }, [walletTokens, auditTokens]);

  const [miniChefV2PoolMap, setMiniChefV2PoolMap] = useState<{
    [lpToken: string]: MiniChefV2PoolInfoWithSafeswapPair
  }>();

  useEffect(() => {
    if (lpTokenPoolInfos && provider && multicallContract && erc20Tokens && farm) {
      setLoading(true);
      const resultMap: {
        [lpToken: string]: MiniChefV2PoolInfoWithSafeswapPair
      } = {};
      const tokensMap: { [address: string]: Token } = erc20Tokens.reduce((map, token) => {
        map[token.address] = token;
        return map;
      }, {} as { [address: string]: Token });
      const wrappMiniChefPoolInfos = async () => {
        console.log("[wrappMiniChefPoolInfos]");
        const pairAddresses = lpTokenPoolInfos.map(poolInfo => poolInfo.lpToken);
        const pairResults = await getPairCallResults(pairAddresses, provider, activeAccount, multicallContract);
        const pairsMap = Object.keys(pairResults).filter(pairAddress => {
          const { token0, token1 } = pairResults[pairAddress];
          return tokensMap[token0] && tokensMap[token1];
        }).reduce((map, pairAddress) => {
          const { token0, token1, reservers } = pairResults[pairAddress];
          const _token0 = new Token(
            tokensMap[token0].chainId, token0, tokensMap[token0].decimals, tokensMap[token0].symbol, tokensMap[token0].name
          );
          const _token1 = new Token(
            tokensMap[token1].chainId, token1, tokensMap[token1].decimals, tokensMap[token1].symbol, tokensMap[token1].name
          );
          const token0Amount = new TokenAmount(_token0, reservers[0].toBigInt());
          const token1Amount = new TokenAmount(_token1, reservers[1].toBigInt());
          map[pairAddress] = new Pair(token0Amount, token1Amount);
          return map;
        }, {} as { [address: string]: Pair });
        Object.keys(pairResults).forEach(lpToken => {
          const poolInfo = lpTokenPoolInfos[
            lpTokenPoolInfos.map(lpTokenInfo => lpTokenInfo.lpToken).indexOf(lpToken)
          ]
          resultMap[lpToken] = {
            pairResult: pairResults[lpToken],
            poolInfo,
            pair: pairsMap[lpToken]
          }
        });

        // 查询 MiniChefV2 在每一个 LP 上的 balance;
        const calls: CallMulticallAggregateContractCall[] =
          pairAddresses.map(lpToken => {
            const call = {
              contract: new Contract(lpToken, IERC20_Interface, provider),
              functionName: "balanceOf",
              params: [miniChefV2Contract?.address],
            }
            return call;
          });
        await SyncCallMulticallAggregate(multicallContract, calls);
        calls.forEach(call => {
          const lpToken = call.contract.address;
          if (resultMap[lpToken]) {
            resultMap[lpToken].poolInfo.lpTokenBalance = call.result;
          }
        });
        setMiniChefV2PoolMap(resultMap);
        setLoading(false);
      }
      wrappMiniChefPoolInfos();
    }
  }, [lpTokenPoolInfos]);

  return {
    farm: result?.farm,
    miniChefV2PoolMap,
    loading: loading || loading2
  };
}
