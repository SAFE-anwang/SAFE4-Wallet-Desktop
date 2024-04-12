import { useEffect } from "react";
import type { MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';
import { Contract } from '@ethersproject/contracts'
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from "../../../hooks/useContracts";
import { useMultipleContractSingleData } from "../../../state/multicall/hooks";
import CallMulticallAggregate from "../../../state/multicall/CallMulticallAggregate";

export default () => {

  const multicallContract = useMulticallContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();

  useEffect(() => {
    if (multicallContract && masternodeStorageContract && supernodeStorageContract) {
      const address = "0x3b712f1CB805800FBB58e61587A0Ef49403c8240";
      const supernodeExistFragment = supernodeStorageContract.interface.getFunction("exist");
      const supernodeExistCall = [
        supernodeStorageContract.address,
        supernodeStorageContract.interface.encodeFunctionData(supernodeExistFragment, [address])
      ]
      console.log("call :", supernodeExistCall);
      multicallContract.callStatic.aggregate([supernodeExistCall])
        .then((data: any) => {
          console.log("data >>", data.returnData)
          // const r = supernodeStorageContract.interface.decodeFunctionResult(supernodeExistFragment, raw)[0]
        })

      const addressExistInSupernodes = {
        contract: supernodeStorageContract,
        functionName: "getInfo",
        params: [address]
      };
      const addressExistInMasternodes = {
        contract: masternodeStorageContract,
        functionName: "exist",
        params: [address]
      }
      CallMulticallAggregate(
        multicallContract,
        [
          addressExistInSupernodes,
          addressExistInMasternodes
        ], () => {
          console.log(">>>", addressExistInSupernodes)
        });
    };
  }
    , [multicallContract, masternodeStorageContract, supernodeStorageContract]);




  return <>

  </>
}
