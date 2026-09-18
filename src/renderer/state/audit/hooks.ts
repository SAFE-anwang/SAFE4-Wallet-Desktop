import { useWeb3React } from "@web3-react/core";
import { useSelector } from "react-redux";
import { AppState } from "..";

export function useAuditTokenList(): {
  address: string, name?: string, symbol?: string, decimals: number, chainId: number, creator?: string, logoURI?: string
}[] | undefined {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!state.audit.tokens || !chainId) return undefined;
    return state.audit.tokens[chainId];
  });
}

export function useMarketTokenPrices(quoteAddress ?: string | undefined): {
  address: string, name: string, symbol: string, decimals: number, logoURI: string,
  change: string, price: string
}[] | undefined {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!state.audit.prices || !chainId) return undefined;
    if (!quoteAddress) {
      return state.audit.prices[chainId];
    } else {
      return state.audit.quotePrices[chainId][quoteAddress];
    }
  });
}

