import { useEffect, useState } from "react";
import { useBlockNumber } from "../state/application/hooks";
import { useSafe4Balance, useWalletsActiveAccount } from "../state/wallets/hooks"
import { useAccountManagerContract, useMulticallContract } from "./useContracts";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";
import { BigNumber } from "ethers";


const Max_Limit = {
  // 合约中 AccountManager.getTotalIDs 的限制,最次最多返回 100 条;
  getTotalIDs: 10
}

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const blockNumber = useBlockNumber();
  const [countResult, setCountResult] = useState<{
    total: number,
    loading: false
  }>();

  useEffect(() => {
    if (!blockNumber || !activeAccount || !accountManagerContract || !multicallContract) return;
    const count = async function () {
      const [_totalAmount, _totalIdCount] = await accountManagerContract.getTotalAmount(activeAccount);
      const totalIdCount = _totalIdCount.toNumber();

      const getTotalIDsCalls: CallMulticallAggregateContractCall[] = [];
      for (let i = 0; i < Math.ceil(totalIdCount / Max_Limit.getTotalIDs); i++) {
        getTotalIDsCalls.push({
          contract: accountManagerContract,
          functionName: "getTotalIDs",
          params: [activeAccount, i * Max_Limit.getTotalIDs, Max_Limit.getTotalIDs]
        })
      }
      await SyncCallMulticallAggregate(multicallContract, getTotalIDsCalls);
      const totalIDs = getTotalIDsCalls.map(call => call.result)
        .reduce((ids, result: BigNumber[]) => {
          ids.push(
            ...result.map(bn => bn.toNumber())
          )
          return ids;
        }, []);
    }
    count();
  }, [blockNumber, activeAccount])


}
