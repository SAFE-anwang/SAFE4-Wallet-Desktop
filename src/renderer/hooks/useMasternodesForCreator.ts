import { useEffect, useState } from "react";
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from "./useContracts"
import { formatSupernodeInfo, SupernodeInfo } from "../structs/Supernode";
import { formatMasternode, MasternodeInfo } from "../structs/Masternode";


export default ({
  creator, checkedMNIds
}: {
  creator: string,
  checkedMNIds?: number[]
}) => {
  const masternodeStorageContract = useMasternodeStorageContract();
  const multilcallContract = useMulticallContract();

  const [result, setResult] = useState<{
    loading: boolean,
    finished: boolean,
    num: number,
    masternodes: MasternodeInfo[]
  }>({
    loading: false,
    finished: false,
    num: 0,
    masternodes: []
  });

  useEffect(() => {
    if (masternodeStorageContract && multilcallContract) {
      const load = async function () {
        const num = await masternodeStorageContract.callStatic.getAddrNum4Creator(creator);
        setResult({
          ...result,
          num: num
        });
        const addresses: string[] = [];
        let masternodes: MasternodeInfo[] = [];
        const offset = 50;
        for (let i = 0; i < Math.ceil(num / offset); i++) {
          const _addr = await masternodeStorageContract.callStatic.getAddrs4Creator(creator, i * offset, offset);
          addresses.push(..._addr);
          const fragment = masternodeStorageContract.interface.getFunction("getInfo")
          const getInfoCalls = _addr.map((address: string) => [
            masternodeStorageContract.address,
            masternodeStorageContract.interface.encodeFunctionData(fragment, [address])
          ]);
          const [_, multicallDatas] = await multilcallContract.callStatic.aggregate(getInfoCalls);
          for (let i = 0; i < multicallDatas.length; i++) {
            const infoRaw = multicallDatas[i];
            const _masternodeInfo = masternodeStorageContract.interface.decodeFunctionResult(fragment, infoRaw)[0];
            const masternodeInfo = formatMasternode(_masternodeInfo);
            masternodes.push(masternodeInfo);
          }
          setResult({
            ...result,
            num,
            masternodes: masternodes
          });
        }
        if (checkedMNIds && checkedMNIds.length > 0) {
          masternodes = masternodes.filter(mn => checkedMNIds.includes(mn.id));
        }
        setResult({
          ...result,
          num : masternodes.length,
          masternodes,
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
  }, [masternodeStorageContract, multilcallContract]);

  return result;
}
