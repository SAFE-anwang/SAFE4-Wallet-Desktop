import { useEffect, useMemo, useState } from "react";
import { useMulticallContract, useSafeswapV2Factory } from "../../../hooks/useContracts";
import { useBlockNumber } from "../../../state/application/hooks";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../state/multicall/CallMulticallAggregate";
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Contract, ethers } from "ethers";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { Web3Provider } from "@ethersproject/providers";
import { useWalletTokens } from "../../../state/transactions/hooks";
import { Pair, Token, TokenAmount } from "@uniswap/sdk";
import { useAuditTokenList } from "../../../state/audit/hooks";


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

export async function getPairCallResults(pairAddresses: string[], provider: Web3Provider, activeAccount: string, multicallContract: Contract) {
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

export interface SafeswapV2Pairs {
  loading: boolean,
  result: {
    pairsMap: { [address: string]: Pair },
    pairBalancesMap: { [address: string]: ethers.BigNumber },
    pairTotalSuppliesMap: { [address: string]: ethers.BigNumber },
    blockNumber: number
  } | undefined
}

export function useSafeswapWalletTokens(auditLogoFilter: boolean | false): Token[] | undefined {
  const walletTokens = useWalletTokens();
  const auditTokens = useAuditTokenList();
  const erc20Tokens = useMemo(() => {
    // 过滤掉 Safeswap V2 这种流动性代币;
    const tokens = walletTokens && walletTokens.filter(token => {
      return token.name != 'Safeswap V2'
    });
    if (auditTokens) {
      const auditToken = auditTokens.filter(auditToken => {
        if (auditLogoFilter) {
          return auditToken.logoURI != undefined && auditToken.logoURI != '';
        }
        return true;
      }).map(token => {
        const { chainId, address, name, symbol, decimals } = token;
        return new Token(chainId, address, decimals, symbol, name);
      });
      if (tokens) {
        const walletTokenAddress = tokens.map(token => token.address);
        return tokens.concat(
          auditToken.filter(auditToken => !walletTokenAddress.includes(auditToken.address))
        )
      } else {
        return auditToken;
      }
    }
    return tokens;
  }, [walletTokens, auditTokens, auditLogoFilter]);
  return erc20Tokens;
}

export function useSafeswapV2Pairs(): SafeswapV2Pairs {

  const blockNumber = useBlockNumber();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const safeswapV2Factory = useSafeswapV2Factory(false);
  const multicallContract = useMulticallContract();
  const [_pairResults, setPairResults] = useState<{
    blockNumber: number,
    pairResults: { [address: string]: PairResult }
  }>();
  const erc20Tokens = useSafeswapWalletTokens(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    pairsMap: { [address: string]: Pair },
    pairBalancesMap: { [address: string]: ethers.BigNumber },
    pairTotalSuppliesMap: { [address: string]: ethers.BigNumber },
    blockNumber: number
  }>();

  useEffect(() => {
    const loadSafeswapV2 = async () => {
      setLoading(true);
      if (safeswapV2Factory && multicallContract && provider && activeAccount) {
        const pairAddresses = await getSafeswapV2PairAddresses(safeswapV2Factory, multicallContract);
        const pairResults = await getPairCallResults(pairAddresses, provider, activeAccount, multicallContract);
        console.log("[SafeswapV2].Update Pairs = ", pairAddresses.length);
        setPairResults({
          blockNumber,
          pairResults: pairResults
        });
      }
    }
    loadSafeswapV2();
  }, [safeswapV2Factory, multicallContract, blockNumber, provider, activeAccount]);

  useEffect(() => {
    if (_pairResults && erc20Tokens) {
      const tokensMap: { [address: string]: Token } = erc20Tokens.reduce((map, token) => {
        map[token.address] = token;
        return map;
      }, {} as { [address: string]: Token });
      const pairResults = _pairResults.pairResults;
      const blockNumber = _pairResults.blockNumber;

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

      console.log("[SafeswapV2].Update Pairs Result.")
      setResult((prev) => {
        if (prev != undefined && prev.blockNumber == blockNumber) {
          return prev
        }
        console.log("-Do Update Pairs Result for blockNumber-", blockNumber)
        return {
          pairsMap,
          pairBalancesMap,
          pairTotalSuppliesMap,
          blockNumber
        };
      });
      setLoading(false);
    }
  }, [_pairResults, erc20Tokens]);

  return {
    result, loading
  }

}
