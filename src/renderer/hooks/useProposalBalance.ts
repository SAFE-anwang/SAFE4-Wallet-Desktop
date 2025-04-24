import { useEffect, useState } from "react";
import { useBlockNumber } from "../state/application/hooks";
import { useProposalContract } from "./useContracts";
import { CurrencyAmount } from "@uniswap/sdk";


export function useProposalBalance(): CurrencyAmount | undefined {
  const proposalContract = useProposalContract();
  const blockNumber = useBlockNumber();
  const [proposalBalance, setProposalBalance] = useState<CurrencyAmount>();
  useEffect(() => {
    if (proposalContract && blockNumber) {
      proposalContract.getBalance().then((data: any) => {
        setProposalBalance(CurrencyAmount.ether(data));
      })
    }
  }, [proposalContract, blockNumber])
  return proposalBalance;
}
