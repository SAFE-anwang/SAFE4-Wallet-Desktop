import { useCallback, useEffect, useRef, useState } from "react";
import { useDAppManagerContract, useMulticallContract } from "../hooks/useContracts";
import { DAppInfo, formatDAppInfo } from "../structs/DApp";
import { useWalletsActiveAccount } from "../state/wallets/hooks";
import { useBlockNumber } from "../state/application/hooks";
import { useWeb3React } from "@web3-react/core";
import { HexToImageBase64 } from "../utils/ImageUtils";
import { DAppInfoWithLogo } from "../state/dApp/reducer";

// 每批数量：一次 multicall 查 20 条 Info + 20 条 Logo
const BATCH_SIZE = 20;

// 判断 logo 是否有效
const isValidLogo = (v: string | undefined | null): v is string =>
  typeof v === "string" && v.length > 0;

// 增量合并：已存在的 id 替换，新增的追加，整体保持倒序
const mergeBatch = (
  prev: DAppInfoWithLogo[],
  batch: DAppInfoWithLogo[]
): DAppInfoWithLogo[] => {
  if (batch.length === 0) return prev;
  const map = new Map<number, DAppInfoWithLogo>();
  prev.forEach((item) => map.set(item.id, item));
  batch.forEach((item) => map.set(item.id, item));
  const merged = Array.from(map.values());
  merged.sort((d0, d1) => d1.id - d0.id);
  return merged;
};

export default (queryMyDAppList: boolean = false) => {
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const activeAccount = useWalletsActiveAccount();
  const dAppManagerContract = useDAppManagerContract();
  const multicallContract = useMulticallContract();

  const [dAppList, setDAppList] = useState<DAppInfoWithLogo[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // 1. 查总数
  const getTotal = useCallback(async (): Promise<number> => {
    if (!dAppManagerContract) return 0;
    if (queryMyDAppList) {
      const num = await dAppManagerContract.getMineNum(activeAccount);
      return num.toNumber();
    }
    const num = await dAppManagerContract.getNum();
    return num.toNumber();
  }, [dAppManagerContract, queryMyDAppList, activeAccount]);

  // 2. 按位置查 ID
  const getIds = useCallback(
    async (position: number, offset: number): Promise<any[]> => {
      if (!dAppManagerContract) return [];
      if (queryMyDAppList) {
        return dAppManagerContract.callStatic.getMineIDs(activeAccount, position, offset);
      }
      return dAppManagerContract.callStatic.getIDs(position, offset);
    },
    [dAppManagerContract, queryMyDAppList, activeAccount]
  );

  // 3. 一批：一次 multicall 查 20 条 Info + 20 条 Logo
  const loadBatch = useCallback(
    async (ids: any[]): Promise<DAppInfoWithLogo[]> => {
      if (!dAppManagerContract || !multicallContract || ids.length === 0) {
        return [];
      }

      const infoFragment = dAppManagerContract.interface.getFunction("getInfo");
      const logoFragment = dAppManagerContract.interface.getFunction("getLogo");

      const infoCalls = ids.map((id: any) => [
        dAppManagerContract.address,
        dAppManagerContract.interface.encodeFunctionData(infoFragment, [id.toNumber()])
      ]);
      const logoCalls = ids.map((id: any) => [
        dAppManagerContract.address,
        dAppManagerContract.interface.encodeFunctionData(logoFragment, [id.toNumber()])
      ]);
      const calls = [...infoCalls, ...logoCalls];

      const data = await multicallContract.callStatic.aggregate(calls);
      const results: string[] = data[1];

      const n = ids.length;
      const list: DAppInfoWithLogo[] = [];
      for (let i = 0; i < n; i++) {
        const rawInfo = results[i];
        const rawLogo = results[n + i];

        const _dAppInfo = dAppManagerContract.interface.decodeFunctionResult(infoFragment, rawInfo)[0];
        const dAppInfo = formatDAppInfo(_dAppInfo);

        const imageHex = dAppManagerContract.interface.decodeFunctionResult(logoFragment, rawLogo)[0];
        const logo = HexToImageBase64(imageHex);

        list.push({
          id: dAppInfo.id,
          dAppInfo,
          logo: isValidLogo(logo) ? logo : undefined
        });
      }

      list.sort((d0, d1) => d1.id - d0.id);
      return list;
    },
    [dAppManagerContract, multicallContract]
  );

  // 4. 主流程
  const fetchData = useCallback(async () => {
    if (!dAppManagerContract || !multicallContract) return;
    if (queryMyDAppList && !activeAccount) return;

    cancelRef.current.cancelled = true;
    const token = { cancelled: false };
    cancelRef.current = token;
    const isCancelled = () => token.cancelled;

    setLoading(true);
    // 不清空已有数据

    // 本轮通过过滤的 id 集合（仅查询全部时用）
    const validIds = new Set<number>();

    try {
      const totalNum = await getTotal();
      if (isCancelled()) return;
      setTotal(totalNum);

      if (totalNum <= 0) {
        if (!queryMyDAppList) {
          // 查询全部且总数为 0，清空
          setDAppList([]);
        }
        return;
      }

      let position = totalNum;
      while (position > 0) {
        if (isCancelled()) return;

        const offset = Math.min(BATCH_SIZE, position);
        const start = position - offset;

        // 4.1 拿 ID
        const ids = await getIds(start, offset);
        if (isCancelled()) return;
        if (!ids || ids.length === 0) {
          position = start;
          continue;
        }

        // 4.2 一批查 Info + Logo
        const batch = await loadBatch(ids);
        if (isCancelled()) return;

        // 4.3 过滤 + 合并
        let toMerge: DAppInfoWithLogo[];
        if (queryMyDAppList) {
          // 我的应用：全部返回
          toMerge = batch;
        } else {
          // 全部应用：只返回有 logo 的
          toMerge = batch.filter((item) => isValidLogo(item.logo));
          toMerge.forEach((item) => validIds.add(item.id));
        }

        setDAppList((prev) => mergeBatch(prev, toMerge));

        position = start;
      }

      // 4.4 查询全部时，全部批次完成后清理本轮不再符合条件的条目
      if (!queryMyDAppList) {
        if (isCancelled()) return;
        setDAppList((prev) => prev.filter((item) => validIds.has(item.id)));
      }
    } catch (err) {
      console.error("useDAppList error:", err);
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [
    dAppManagerContract,
    multicallContract,
    queryMyDAppList,
    activeAccount,
    getTotal,
    getIds,
    loadBatch
  ]);

  useEffect(() => {
    fetchData();
    return () => {
      cancelRef.current.cancelled = true;
    };
  }, [chainId, blockNumber, fetchData]);

  return { dAppList, total, loading, refetch: fetchData };
};
