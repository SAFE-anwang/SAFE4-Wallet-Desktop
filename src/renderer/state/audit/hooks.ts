import { useWeb3React } from "@web3-react/core";
import { useSelector } from "react-redux";
import { AppState } from "..";

export function useAuditTokenList(): {
  address: string, name ?: string, symbol ?: string, decimals: number, chainId: number
}[] | undefined {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!state.audit.tokens || !chainId) return undefined;
    return state.audit.tokens[chainId];
  });
}

