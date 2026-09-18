import { useCallback, useEffect, useRef } from "react";
import { useDAppManagerContract, useMulticallContract } from "./useContracts";
import { formatDAppInfo } from "../structs/DApp";
import { useWalletsActiveAccount } from "../state/wallets/hooks";
import { useBlockNumber } from "../state/application/hooks";
import { useWeb3React } from "@web3-react/core";
import { HexToImageBase64 } from "../utils/ImageUtils";
import { DAppInfoWithLogo } from "../state/dApp/reducer";

const BATCH_SIZE = 10;

const isValidLogo = (v: string | undefined | null): v is string =>
  typeof v === "string" && v.length > 0;

interface UseFetchDAppListOptions {
  queryMyDAppList?: boolean;
  /** 是否只返回有 logo 的应用，默认 false */
  onlyWithLogo?: boolean;
  onBatch?: (
    batch: DAppInfoWithLogo[],
    meta: {
      position: number;
      offset: number;
      total: number;
      isLast: boolean;
      validIds: Set<number>;
    }
  ) => void;
  onComplete?: (meta: {
    total: number;
    validIds: Set<number>;
  }) => void;
}

export default function useFetchDAppList(options: UseFetchDAppListOptions = {}) {
  const {
    queryMyDAppList = false,
    onlyWithLogo = false,
    onBatch,
    onComplete
  } = options;

  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const activeAccount = useWalletsActiveAccount();
  const dAppManagerContract = useDAppManagerContract();
  const multicallContract = useMulticallContract();

  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const onBatchRef = useRef(onBatch);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onBatchRef.current = onBatch;
    onCompleteRef.current = onComplete;
  }, [onBatch, onComplete]);

  const getTotal = useCallback(async (): Promise<number> => {
    if (!dAppManagerContract) return 0;
    if (queryMyDAppList) {
      const num = await dAppManagerContract.getMineNum(activeAccount);
      console.log("DApp.getMineNum() <=", num.toNumber())
      return num.toNumber();
    }
    const num = await dAppManagerContract.getNum();
    console.log("DApp.getNum() <=", num.toNumber())
    return num.toNumber();
  }, [dAppManagerContract, queryMyDAppList, activeAccount]);

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

  const fetchData = useCallback(async () => {
    if (!dAppManagerContract || !multicallContract) return;
    if (queryMyDAppList && !activeAccount) return;

    cancelRef.current.cancelled = true;
    const token = { cancelled: false };
    cancelRef.current = token;
    const isCancelled = () => token.cancelled;

    const validIds = new Set<number>();

    try {
      const totalNum = await getTotal();
      if (isCancelled()) return;

      if (totalNum <= 0) {
        onBatchRef.current?.([], {
          position: 0,
          offset: 0,
          total: 0,
          isLast: true,
          validIds
        });
        onCompleteRef.current?.({ total: 0, validIds });
        return;
      }

      let position = totalNum;
      while (position > 0) {
        if (isCancelled()) return;

        const offset = Math.min(BATCH_SIZE, position);
        const start = position - offset;

        const ids = await getIds(start, offset);
        if (isCancelled()) return;
        if (!ids || ids.length === 0) {
          position = start;
          continue;
        }

        const batch = await loadBatch(ids);
        if (isCancelled()) return;

        // 过滤：onlyWithLogo 控制
        let toEmit: DAppInfoWithLogo[];
        if (onlyWithLogo) {
          toEmit = batch.filter((item) => isValidLogo(item.logo));
        } else {
          toEmit = batch;
        }
        // 无论是否过滤，都记录本轮要保留的 id
        toEmit.forEach((item) => validIds.add(item.id));

        const isLast = start === 0;

        onBatchRef.current?.(toEmit, {
          position: start,
          offset,
          total: totalNum,
          isLast,
          validIds
        });

        position = start;
      }

      if (isCancelled()) return;
      onCompleteRef.current?.({ total: totalNum, validIds });
    } catch (err) {
      console.error("useFetchDAppList error:", err);
    }
  }, [
    dAppManagerContract,
    multicallContract,
    queryMyDAppList,
    onlyWithLogo,
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

  return { refetch: fetchData };
}
