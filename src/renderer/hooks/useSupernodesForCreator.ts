import { useEffect, useState } from "react";
import { useMulticallContract, useSupernodeStorageContract } from "./useContracts"
import { formatSupernodeInfo, SupernodeInfo } from "../structs/Supernode";


export default ({
  creator
}: {
  creator: string
}) => {
  const supernodeStorageContract = useSupernodeStorageContract();
  const multilcallContract = useMulticallContract();

  const [result, setResult] = useState<{
    loading: boolean,
    finished: boolean,
    num: number,
    supernodes: SupernodeInfo[]
  }>({
    loading: false,
    finished: false,
    num: 0,
    supernodes: []
  });

  useEffect(() => {
    if (supernodeStorageContract && multilcallContract) {
      const load = async function () {
        const num = await supernodeStorageContract.callStatic.getAddrNum4Creator(creator);
        setResult({
          ...result,
          num: num
        })
        const addresses: string[] = [];
        const supernodes: SupernodeInfo[] = [];
        const offset = 1;
        for (let i = 0; i < Math.ceil(num / offset); i++) {
          const _addr = await supernodeStorageContract.callStatic.getAddrs4Creator(creator, i * offset, offset);
          addresses.push(..._addr);
          const fragment = supernodeStorageContract.interface.getFunction("getInfo")
          const getInfoCalls = _addr.map((address: string) => [
            supernodeStorageContract.address,
            supernodeStorageContract.interface.encodeFunctionData(fragment, [address])
          ]);
          const [_, multicallDatas] = await multilcallContract.callStatic.aggregate(getInfoCalls);
          for (let i = 0; i < multicallDatas.length; i++) {
            const infoRaw = multicallDatas[i];
            const _supernodeInfo = supernodeStorageContract.interface.decodeFunctionResult(fragment, infoRaw)[0];
            const supernodeInfo = formatSupernodeInfo(_supernodeInfo);
            supernodes.push(supernodeInfo);
          }
          setResult({
            ...result,
            supernodes: supernodes
          });
        }
        setResult({
          ...result,
          supernodes,
          loading: false,
          finished: true
        })
      }
      setResult({
        ...result,
        loading: true
      })
      load();
    }
  }, [supernodeStorageContract, multilcallContract]);

  return result;
}
