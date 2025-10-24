import React, { useEffect, useRef, useState } from "react";
import { useBlockNumber } from "../state/application/hooks";
import { useWalletsActiveAccount } from "../state/wallets/hooks";
import { useAccountManagerContract, useMulticallContract } from "./useContracts";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";
import { BigNumber } from "ethers";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../structs/AccountManager";
import { Progress, Space, Tooltip, Typography } from "antd";

const { Text } = Typography;

const Max_Limit = {
  getTotalIDs: 100,
};

export default (): {
  result: {
    activeAccount: string;
    accountRecords: AccountRecord[] | undefined;
    loading: boolean;
    totalIdCount: number | undefined;
    totalIds: number[] | undefined;
  };
  Render: () => JSX.Element;
} => {
  const activeAccount = useWalletsActiveAccount();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const blockNumber = useBlockNumber();

  const [result, setResult] = useState<{
    activeAccount: string;
    accountRecords: AccountRecord[] | undefined;
    loading: boolean;
    totalIdCount: number | undefined;
    totalIds: number[] | undefined;
  }>({
    activeAccount,
    accountRecords: undefined,
    loading: true,
    totalIdCount: undefined,
    totalIds: undefined,
  });

  const lastAccountRef = useRef<string | undefined>(undefined);
  const isUnmountedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!blockNumber || !activeAccount || !accountManagerContract || !multicallContract) return;
    const accountChanged = lastAccountRef.current !== activeAccount;
    // 如果正在加载，且账户未变，不重新执行（防止中途 blockNumber 变更打断加载）
    if (isLoadingRef.current && !accountChanged) {
      console.log("[useAccountRecords]-正在加载，且账户未变，不重新执行...")
      return;
    }
    const shutdown = () => {
      return isUnmountedRef.current || lastAccountRef.current != activeAccount;
    }
    isLoadingRef.current = true;
    lastAccountRef.current = activeAccount;

    const count = async function () {
      try {
        setResult({
          activeAccount,
          accountRecords: undefined,
          loading: true,
          totalIdCount: undefined,
          totalIds: undefined,
        });

        // 从合约查询一共有多少条锁仓记录
        const [_totalAmount, _totalIdCount] = await accountManagerContract.getTotalAmount(activeAccount);
        const totalIdCount = _totalIdCount.toNumber();

        if (shutdown()) {
          console.log("[useAccountRecors] 组件已卸载|账户变更,停止任务...")
          return;
        }
        setResult({
          activeAccount,
          accountRecords: undefined,
          loading: true,
          totalIdCount,
          totalIds: undefined,
        });

        // --- 获取全部 IDs ---
        let batchSize = Max_Limit.getTotalIDs; // 100
        let multiCallCount = 10;
        let totalBatches = Math.ceil(totalIdCount / (batchSize * multiCallCount));
        const getAllIdMultiPromises: Promise<void>[] = [];
        const allIDs: number[] = [];

        for (let i = 0; i < totalBatches; i++) {
          const getTotalIDsCalls: CallMulticallAggregateContractCall[] = [];
          for (let j = 0; j < multiCallCount; j++) {
            const offset = i * batchSize * multiCallCount + j * batchSize;
            if (offset >= totalIdCount) break;
            const limit = Math.min(batchSize, totalIdCount - offset);
            getTotalIDsCalls.push({
              contract: accountManagerContract,
              functionName: "getTotalIDs",
              params: [activeAccount, offset, limit],
            });
          }
          getAllIdMultiPromises.push(
            (async () => {
              await SyncCallMulticallAggregate(multicallContract, getTotalIDsCalls);
              getTotalIDsCalls.forEach((call) => {
                if (call.result && Array.isArray(call.result)) {
                  allIDs.push(...call.result.map((bn: BigNumber) => bn.toNumber()));
                }
              });
              console.log("[useAccountRecords]-|...allIDs...|", allIDs.length);
            })()
          );
        }
        await Promise.all(getAllIdMultiPromises);
        if (shutdown()) {
          console.log("[useAccountRecors] 组件已卸载|账户变更,停止任务...")
          return;
        }
        setResult({
          activeAccount,
          accountRecords: undefined,
          loading: true,
          totalIdCount,
          totalIds: allIDs.sort((id0, id1) => id1 - id0),
        });

        // --- 获取详情 ---
        const batchSizeDetail = 100;
        const maxConcurrent = 5;

        let _Account_Records_: AccountRecord[] = [];
        for (let i = 0; i < allIDs.length; i += batchSizeDetail * maxConcurrent) {
          if (shutdown()) {
            console.log("[useAccountRecors] 组件已卸载|账户变更,停止任务...")
            return;
          }
          const sliceBatches = allIDs.slice(i, i + batchSizeDetail * maxConcurrent);
          const multiCallPromises: Promise<any>[] = [];

          for (let j = 0; j < sliceBatches.length; j += batchSizeDetail) {
            const batchIDs = sliceBatches.slice(j, j + batchSizeDetail);
            const calls: CallMulticallAggregateContractCall[] = batchIDs.flatMap((id) => [
              {
                contract: accountManagerContract,
                functionName: "getRecordByID",
                params: [id],
              },
              {
                contract: accountManagerContract,
                functionName: "getRecordUseInfo",
                params: [id],
              },
            ]);
            multiCallPromises.push(
              (async () => {
                await SyncCallMulticallAggregate(multicallContract, calls);
                return calls.map((call) => {
                  const id = call.params[0];
                  const functionName = call.functionName;
                  if (functionName == "getRecordByID") {
                    return { id, getRecordByID: formatAccountRecord(call.result) };
                  }
                  if (functionName == "getRecordUseInfo") {
                    return { id, getRecordUseInfo: formatRecordUseInfo(call.result) };
                  }
                });
              })()
            );
          }
          const results = await Promise.all(multiCallPromises);
          const flattenedResults = results.flat();
          const merged = flattenedResults.reduce((acc, item) => {
            if (!item) return acc;
            const { id } = item;
            if (!acc[id]) acc[id] = { id };
            Object.assign(acc[id], item);
            return acc;
          }, {} as Record<number, any>);
          const accountRecords = Object.values(merged).map((value: any) => {
            const { getRecordByID, getRecordUseInfo } = value;
            return { ...getRecordByID, recordUseInfo: getRecordUseInfo };
          });
          _Account_Records_ = _Account_Records_.concat(accountRecords);
          setResult({
            activeAccount,
            accountRecords: _Account_Records_,
            loading: _Account_Records_.length !== allIDs.length,
            totalIdCount,
            totalIds: allIDs,
          });
        }
        isLoadingRef.current = false;
      } catch (err) {
        console.log("Error!!:", err);
        isLoadingRef.current = false;
      } finally {

      }
    };
    count();
  }, [blockNumber, activeAccount]);

  const Render = () => {
    let percent = 0;
    if (result && result.accountRecords && result.totalIdCount) {
      percent = Math.ceil((result.accountRecords.length * 100) / result.totalIdCount);
    }
    return (
      <>
        <Tooltip
          title={
            <Text style={{ color: "white" }}>
              同步锁仓记录:{result.accountRecords?.length} / {result.totalIdCount}
            </Text>
          }
        >
          <Progress size={24} percent={percent} type="circle" />
        </Tooltip>
      </>
    );
  };

  return { result, Render };
};
