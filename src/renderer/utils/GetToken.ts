import { Token } from "@uniswap/sdk";
import { Contract } from "ethers";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";
import { IERC20_Interface } from "../abis";

export default async (tokenAddresses: string[], multicall: Contract, chainId: number) => {
  console.log("Get Token For" , tokenAddresses);
  const addresses = [...new Set(tokenAddresses)];
  const tokenMap: {
    [address: string]: Token | undefined
  } = {};
  const calls: CallMulticallAggregateContractCall[] = [];
  addresses.forEach(address => {
    const IERC20 = new Contract(address, IERC20_Interface);
    calls.push({
      contract: IERC20,
      functionName: "name",
      params: []
    });
    calls.push({
      contract: IERC20,
      functionName: "symbol",
      params: []
    });
    calls.push({
      contract: IERC20,
      functionName: "decimals",
      params: []
    });
  })
  await SyncCallMulticallAggregate(multicall, calls);
  for (let i = 0; i < calls.length / 3; i++) {
    const nameIndex = i * 3;
    const symbolIndex = nameIndex + 1;
    const decimalsIndex = nameIndex + 2;
    const address = calls[nameIndex].contract.address;
    const name = calls[nameIndex].result;
    const symbol = calls[symbolIndex].result;
    const decimals = calls[decimalsIndex].result;
    tokenMap[address] = new Token(
      chainId,
      address,
      decimals,
      symbol,
      name
    )
  }
  return tokenMap;
}
