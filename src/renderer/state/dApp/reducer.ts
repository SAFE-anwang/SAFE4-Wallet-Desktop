import { createReducer } from "@reduxjs/toolkit";
import { Safe4NetworkChainId } from "../../config";
import { DAppInfo } from "../../structs/DApp";
import { updateDAppList, clearDAppList, DAppScope, upsertDAppRpc, resetDAppRpc } from "./actions";
import { Default_BlockchainRpcProps } from "../../pages/main/dapps/BlockchainChainID_RPC";

export interface DAppInfoWithLogo {
  id: number;
  dAppInfo: DAppInfo;
  logo: string | undefined;
}

export interface IDAppListEntry {
  total: number;
  list: DAppInfoWithLogo[];
  loading: boolean;
}

export interface BlockchainRpcProp {
  chainId: number;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  chainName?: string;
}

export interface IDAppListState {
  // rpc 配置;
  rpcs: {
    [chainId: number]: BlockchainRpcProp
  };
  // 应用信息
  all: {
    [chainId: number]: IDAppListEntry;
  };
  mine: {
    [address: string]: {
      [chainId: number]: IDAppListEntry;
    };
  };
}

const emptyEntry = (): IDAppListEntry => ({ total: 0, list: [], loading: false });

const initialState: IDAppListState = {
  rpcs: Default_BlockchainRpcProps,
  all: {
    [Safe4NetworkChainId.Testnet]: emptyEntry(),
    [Safe4NetworkChainId.Mainnet]: emptyEntry(),
  },
  mine: {},
};

const getEntry = (
  state: IDAppListState,
  scope: DAppScope,
  chainId: number,
  address?: string
): IDAppListEntry | undefined => {
  if (scope === "all") {
    return state.all[chainId];
  }
  if (!address) return undefined;
  return state.mine[address]?.[chainId];
};

const ensureEntry = (
  state: IDAppListState,
  scope: DAppScope,
  chainId: number,
  address?: string
): IDAppListEntry | undefined => {
  if (scope === "all") {
    if (!state.all[chainId]) state.all[chainId] = emptyEntry();
    return state.all[chainId];
  }
  if (!address) return undefined;
  if (!state.mine[address]) state.mine[address] = {};
  if (!state.mine[address][chainId]) state.mine[address][chainId] = emptyEntry();
  return state.mine[address][chainId];
};

export default createReducer(initialState, (builder) => {
  builder.addCase(updateDAppList, (state, { payload }) => {
    const { chainId, scope, address, total, list, loading } = payload;
    const entry = ensureEntry(state, scope, chainId, address);
    if (!entry) return;
    if (total !== undefined) entry.total = total;
    if (list !== undefined) entry.list = list;
    if (loading !== undefined) entry.loading = loading;
  });

  builder.addCase(clearDAppList, (state, { payload }) => {
    const { chainId, scope, address } = payload;
    const entry = ensureEntry(state, scope, chainId, address);
    if (!entry) return;
    entry.total = 0;
    entry.list = [];
    entry.loading = false;
  });

  builder.addCase(upsertDAppRpc, (state, { payload }) => {
    const chainId = payload.chainId;
    // 如果 chainId 存在，则替换；不存在则新增。
    // 直接赋值即可，Immer 内部会处理"存在即覆盖，不存在即新增"。
    state.rpcs[chainId] = payload;
  });

  builder.addCase(resetDAppRpc, (state) => {
    // 重置为默认配置。
    state.rpcs = { ...Default_BlockchainRpcProps };
  });

});
