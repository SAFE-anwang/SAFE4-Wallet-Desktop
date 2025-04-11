import { useEffect, useMemo, useState } from "react";
import { useMulticallContract, useSafeswapV2Factory } from "../../../hooks/useContracts";
import { useBlockNumber } from "../../../state/application/hooks";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../state/multicall/CallMulticallAggregate";
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Contract, ethers } from "ethers";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { Web3Provider } from "@ethersproject/providers";
import { useTokens } from "../../../state/transactions/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import { Pair, Token, TokenAmount } from "@uniswap/sdk";


async function getSafeswapV2PairAddresses(safeswapV2Factory: Contract, multicallContract: Contract) {
  const data = await safeswapV2Factory.allPairsLength();
  const pairsLength = data.toNumber();
  const calls: CallMulticallAggregateContractCall[] = [];
  for (let i = 0; i < pairsLength; i++) {
    calls.push({
      contract: safeswapV2Factory,
      functionName: "allPairs",
      params: [i],
    })
  }
  await SyncCallMulticallAggregate(multicallContract, calls);
  return calls.map(call => call.result);
}

async function getPairCallResults(pairAddresses: string[], provider: Web3Provider, activeAccount: string, multicallContract: Contract) {
  const pairCallResult: {
    [address: string]: {
      token0_call: CallMulticallAggregateContractCall,
      token1_call: CallMulticallAggregateContractCall,
      totalSupply_call: CallMulticallAggregateContractCall,
      balanceOf_call: CallMulticallAggregateContractCall,
      reservers_call: CallMulticallAggregateContractCall,
    }
  } = {};
  pairAddresses.forEach(address => {
    const pairContract = new Contract(address, PairABI, provider);
    const token0_call = {
      contract: pairContract,
      functionName: "token0",
      params: [],
    }
    const token1_call = {
      contract: pairContract,
      functionName: "token1",
      params: [],
    }
    const totalSupply_call = {
      contract: pairContract,
      functionName: "totalSupply",
      params: [],
    }
    const balanceOf_call = {
      contract: pairContract,
      functionName: "balanceOf",
      params: [activeAccount],
    }
    const reservers_call = {
      contract: pairContract,
      functionName: "getReserves",
      params: [],
    };
    pairCallResult[address] = {
      token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call
    }
  });
  const calls: CallMulticallAggregateContractCall[] = [];
  Object.keys(pairCallResult).forEach(address => {
    const { token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call } = pairCallResult[address];
    calls.push(
      token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call
    )
  });
  await SyncCallMulticallAggregate(multicallContract, calls);
  const pairResult: {
    [address: string]: PairResult
  } = {};
  Object.keys(pairCallResult).forEach(address => {
    const { token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call } = pairCallResult[address];
    pairResult[address] = {
      token0: token0_call.result,
      token1: token1_call.result,
      totalSupply: totalSupply_call.result,
      balanceOf: balanceOf_call.result,
      reservers: reservers_call.result
    }
  });
  return pairResult;
}

export interface PairResult {
  token0: string,
  token1: string,
  totalSupply: ethers.BigNumber,
  balanceOf: ethers.BigNumber,
  reservers: [ethers.BigNumber, ethers.BigNumber]
}

export function useSafeswapV2Pairs() {

  const blockNumber = useBlockNumber();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const safeswapV2Factory = useSafeswapV2Factory(false);
  const multicallContract = useMulticallContract();
  const [pairResults, setPairResults] = useState<{ [address: string]: PairResult }>();
  const walletTokens = useTokens();
  const erc20Tokens = useMemo(() => {
    if (chainId) {
      const defaultTokens = [
        USDT[chainId as Safe4NetworkChainId],
        WSAFE[chainId as Safe4NetworkChainId],
      ]
      return defaultTokens.concat(walletTokens && Object.keys(walletTokens).map((address) => {
        const { name, decimals, symbol } = walletTokens[address];
        return new Token(chainId, address, decimals, symbol, name);
      }));
    }
  }, [chainId, walletTokens]);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    pairsMap: { [address: string]: Pair },
    pairBalancesMap: { [address: string]: ethers.BigNumber },
    pairTotalSuppliesMap: { [address: string]: ethers.BigNumber }
  }>();

  useEffect(() => {
    const loadSafeswapV2 = async () => {
      setLoading(true);
      if (safeswapV2Factory && multicallContract && provider && activeAccount) {
        const pairAddresses = await getSafeswapV2PairAddresses(safeswapV2Factory, multicallContract);
        const pairResults = await getPairCallResults(pairAddresses, provider, activeAccount, multicallContract);
        console.log("[SafeswapV2].Update Pairs = ", pairAddresses.length);
        setPairResults(pairResults);
      }
    }
    loadSafeswapV2();
  }, [safeswapV2Factory, multicallContract, blockNumber, provider, activeAccount]);

  useEffect(() => {
    if (pairResults && erc20Tokens) {
      const tokensMap: { [address: string]: Token } = erc20Tokens.reduce((map, token) => {
        map[token.address] = token;
        return map;
      }, {} as { [address: string]: Token });

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

      const pairBalancesMap = Object.keys(pairsMap).reduce((map, pairAddress) => {
        map[pairAddress] = pairResults[pairAddress].balanceOf;
        return map;
      }, {} as { [address: string]: ethers.BigNumber });

      const pairTotalSuppliesMap = Object.keys(pairsMap).reduce((map, pairAddress) => {
        map[pairAddress] = pairResults[pairAddress].totalSupply;
        return map;
      }, {} as { [address: string]: ethers.BigNumber });

      setResult({
        pairsMap, pairBalancesMap, pairTotalSuppliesMap
      })
      setLoading(false);

    }
  }, [pairResults, erc20Tokens]);
  return {
    result , loading
  }
}
