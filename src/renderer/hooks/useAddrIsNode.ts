import { useEffect, useState } from "react";
import { useBlockNumber } from "../state/application/hooks";
import { formatMasternode, MasternodeInfo } from "../structs/Masternode";
import { formatSupernodeInfo, SupernodeInfo } from "../structs/Supernode";
import { useMasternodeLogicContract, useMasternodeStorageContract, useMulticallContract, useSupernodeLogicContract, useSupernodeStorageContract } from "./useContracts";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../state/multicall/CallMulticallAggregate";


export interface AddrNodeInfo {
  isNode: boolean,
  isMN: boolean,
  isSN: boolean,
  masternodeInfo: MasternodeInfo | undefined,
  supernodeInfo: SupernodeInfo | undefined
}

export default function useAddrNodeInfo(addr: string): AddrNodeInfo | undefined {
  const multicallContract = useMulticallContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const blockNumber = useBlockNumber();
  const [result, setResult] = useState<AddrNodeInfo>();
  useEffect(() => {
    if (addr && multicallContract && masternodeStorageContract && supernodeStorageContract) {

      const addrIsSNCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "exist",
        params: [addr]
      };
      const addrIsMNCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "exist",
        params: [addr]
      };
      const getSNInfoCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "getInfo",
        params: [addr]
      };
      const getMNInfoCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "getInfo",
        params: [addr]
      };
      CallMulticallAggregate(
        multicallContract,
        [addrIsSNCall, addrIsMNCall , getSNInfoCall , getMNInfoCall],
        () => {
          setResult({
            isNode : addrIsMNCall.result || addrIsSNCall.result,
            isMN : addrIsMNCall.result,
            isSN : addrIsSNCall.result,
            masternodeInfo : getMNInfoCall.result ? formatMasternode( getMNInfoCall.result ) : undefined,
            supernodeInfo : getSNInfoCall.result ? formatSupernodeInfo( getSNInfoCall.result ) : undefined
          })
        }
      )
    }
  }, [addr, multicallContract, masternodeStorageContract, supernodeStorageContract, blockNumber]);
  return result;
}
