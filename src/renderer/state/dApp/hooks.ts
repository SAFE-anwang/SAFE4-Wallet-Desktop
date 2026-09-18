import { useSelector } from "react-redux";
import { AppState } from "..";
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../wallets/hooks";
import { BlockchainRpcProp, IDAppListEntry } from "./reducer";
import { DAppScope } from "./actions";

export function useDAppList(scope: DAppScope = "all"): IDAppListEntry {
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();

  return useSelector((state: AppState) => {
    if (!chainId) return { total: 0, list: [], loading: false };

    if (scope === "mine") {
      if (!activeAccount) return { total: 0, list: [], loading: false };
      return state.dApp.mine[activeAccount]?.[chainId]
        ?? { total: 0, list: [], loading: false };
    }

    return state.dApp.all[chainId]
      ?? { total: 0, list: [], loading: false };
  });
}

export function useDAppBlockchainRpcProps(): {
  [chainId: number]: BlockchainRpcProp
} {
  return useSelector((state: AppState) => {
    return state.dApp.rpcs;
  });
}
