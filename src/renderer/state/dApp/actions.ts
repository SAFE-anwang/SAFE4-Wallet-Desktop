import { createAction } from "@reduxjs/toolkit";
import { DAppInfoWithLogo } from "./reducer";

export type DAppScope = "all" | "mine";

export const updateDAppList = createAction<{
  chainId: number;
  scope: DAppScope;
  address?: string;      // scope = "mine" 时必传
  total?: number;
  list?: DAppInfoWithLogo[];
  loading?: boolean;
}>("dApps/updateDAppList");

export const clearDAppList = createAction<{
  chainId: number;
  scope: DAppScope;
  address?: string;
}>("dApps/clearDAppList");

export const upsertDAppRpc = createAction<{
  chainId: number;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  chainName?: string;
}>("dApps/upsertRpc");

export const resetDAppRpc = createAction("dApps/resetRpcs")
