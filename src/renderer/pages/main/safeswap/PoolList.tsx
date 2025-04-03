import { useEffect, useMemo, useState } from "react";
import { useTokens } from "../../../state/transactions/hooks";
import { ChainId, JSBI, Token } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { useContract, useMulticallContract, useSafeswapV2Factory, useSafeswapV2Router } from "../../../hooks/useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { Contract } from "ethers";
import { PairABI } from "../../../constants/SafeswapAbiConfig";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";



export default () => {

  const tokens = useTokens();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const safeswapV2Factory = useSafeswapV2Factory(false);
  const multicallContract = useMulticallContract();
  const [allPairs, setAllPairs] = useState<string[]>();

  const nameEqSafeswapV2Tokens = useMemo(() => {
    if (tokens && chainId) {
      return Object.keys(tokens)
        .filter(address => {
          return tokens[address].chainId == chainId
            && tokens[address].name == "Safeswap V2"
        })
        .map(address => {
          const { name, symbol, decimals } = tokens[address];
          const token = new Token(
            ChainId.MAINNET,
            address, decimals,
            symbol, name
          );
          return token;
        });
    }
    return undefined
  }, [tokens, chainId]);
  useEffect(() => {
    if (safeswapV2Factory && multicallContract) {
      safeswapV2Factory.allPairsLength()
        .then((data: any) => {
          const pairsLength = data.toNumber();
          const calls: CallMulticallAggregateContractCall[] = [];
          for (let i = 0; i < pairsLength; i++) {
            calls.push({
              contract: safeswapV2Factory,
              functionName: "allPairs",
              params: [i],
            })
          }
          CallMulticallAggregate(multicallContract, calls, () => {
            setAllPairs(calls.map(call => call.result));
          });
        });
    }
  }, [safeswapV2Factory, multicallContract]);
  const activeAccountPairs = useMemo(() => {
    if (nameEqSafeswapV2Tokens && allPairs) {
      return nameEqSafeswapV2Tokens.filter(token => {
        const address = token.address;
        return allPairs.includes(address)
      })
    }
  }, [nameEqSafeswapV2Tokens, allPairs]);

  useEffect(() => {
    if (activeAccountPairs && multicallContract && provider && activeAccount) {

      const pairResult: {
        [pairAddress: string]: {
          token0_call: CallMulticallAggregateContractCall,
          token1_call: CallMulticallAggregateContractCall,
          totalSupply_call: CallMulticallAggregateContractCall,
          balanceOf_call: CallMulticallAggregateContractCall,
          reservers_call: CallMulticallAggregateContractCall,
        }
      } = {};

      activeAccountPairs.forEach(pairToken => {
        const pairContract = new Contract(pairToken.address, PairABI, provider);
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
        pairResult[pairToken.address] = {
          token0_call, token1_call, totalSupply_call, balanceOf_call, reservers_call
        }
      });


      const calls : CallMulticallAggregateContractCall[] = [];
      Object.keys(pairResult).forEach(address => {
        const { token0_call , token1_call , totalSupply_call , balanceOf_call , reservers_call } = pairResult[address];
        calls.push(
          token0_call , token1_call , totalSupply_call , balanceOf_call , reservers_call
        )
      });
      CallMulticallAggregate( multicallContract , calls , () => {
        console.log( calls ) ;
        console.log( "After Multicall :" , pairResult )
      });

    }
  }, [activeAccountPairs, multicallContract, provider, activeAccount]);

  return <>
    {
      JSON.stringify(activeAccountPairs)
    }
  </>

}
