import { useEffect, useState } from "react"
import { useMulticallContract, useSupernodeStorageContract } from "./useContracts";
import { useBlockNumber } from "../state/application/hooks";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../state/multicall/CallMulticallAggregate";



export default () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const supernodeStorageContract = useSupernodeStorageContract();
  const blockNumber = useBlockNumber();
  const multilcallContract = useMulticallContract();
  useEffect(() => {
    if (!blockNumber || !multilcallContract || !supernodeStorageContract) return;
    const load = async () => {
      const supernodeTotalCount = (await supernodeStorageContract.getNum()).toNumber();
      const calls: CallMulticallAggregateContractCall[] = [];
      for (let i = 0; i < Math.ceil(supernodeTotalCount / 100); i++) {
        calls.push({
          contract: supernodeStorageContract,
          functionName: "getAll",
          params: [i * 100, 100]
        })
      }
      await SyncCallMulticallAggregate(multilcallContract, calls);
      const addresses = calls.map(call => call.result)[0];
      setAddresses(addresses);
    };
    load();
  }, [blockNumber, supernodeStorageContract]);

  return addresses;
}
