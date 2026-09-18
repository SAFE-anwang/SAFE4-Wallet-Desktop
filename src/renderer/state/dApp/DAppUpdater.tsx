import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useWeb3React } from "@web3-react/core";
import { DAppInfoWithLogo } from "./reducer";
import { DAppScope, updateDAppList } from "./actions";
import useFetchDAppList from "../../hooks/useFetchDAppList";
import { useWalletsActiveAccount } from "../wallets/hooks";

const mergeLists = (
  prev: DAppInfoWithLogo[],
  batch: DAppInfoWithLogo[]
): DAppInfoWithLogo[] => {
  const map = new Map<number, DAppInfoWithLogo>();
  prev.forEach((item) => map.set(item.id, item));
  batch.forEach((item) => map.set(item.id, item));
  const merged = Array.from(map.values());
  merged.sort((d0, d1) => d1.id - d0.id);
  return merged;
};

export default function DAppListUpdater({
  queryMyDAppList = false,
  onlyWithLogo = false
}: {
  queryMyDAppList?: boolean;
  onlyWithLogo?: boolean;
}) {

  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const dispatch = useDispatch();

  const scope: DAppScope = queryMyDAppList ? "mine" : "all";
  const address = queryMyDAppList ? activeAccount : undefined;

  const listRef = useRef<DAppInfoWithLogo[]>([]);

  // 切换链 / 地址 / 模式 / 过滤开关时重置本地累积
  useEffect(() => {
    listRef.current = [];
  }, [chainId, address, queryMyDAppList, onlyWithLogo]);

  // 开始加载前，先把 loading 置 true、清空该地址的旧列表
  useEffect(() => {
    if (!chainId) return;
    if (scope === "mine" && !address) return;
    dispatch(updateDAppList({
      chainId,
      scope,
      address,
      total: 0,
      list: [],
      loading: true
    }));
    listRef.current = [];
  }, [chainId, address, scope, onlyWithLogo, dispatch]);

  const onBatch = useCallback(
    (batch: DAppInfoWithLogo[], meta: { total: number; validIds: Set<number> }) => {
      if (!chainId) return;
      if (scope === "mine" && !address) return;

      listRef.current = mergeLists(listRef.current, batch);

      dispatch(updateDAppList({
        chainId,
        scope,
        address,
        total: meta.total,
        list: listRef.current,
        loading: true
      }));
    },
    [chainId, scope, address, dispatch]
  );

  const onComplete = useCallback(
    (meta: { total: number; validIds: Set<number> }) => {
      if (!chainId) return;
      if (scope === "mine" && !address) return;

      // 用本轮 meta.validIds 过滤，移除已删除的条目
      const finalList = listRef.current.filter((item) =>
        meta.validIds.has(item.id)
      );
      listRef.current = finalList;

      dispatch(updateDAppList({
        chainId,
        scope,
        address,
        total: meta.total,
        list: finalList,
        loading: false
      }));
    },
    [chainId, scope, address, dispatch]
  );

  useFetchDAppList({
    queryMyDAppList,
    onlyWithLogo,
    onBatch,
    onComplete
  });

  return null;
}
