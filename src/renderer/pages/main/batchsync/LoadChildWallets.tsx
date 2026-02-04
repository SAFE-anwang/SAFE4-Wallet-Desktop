import { useEffect, useState } from "react";
import { useActiveAccountChildWallets } from "../../../state/wallets/hooks";
import { SupportChildWalletType } from "../../../utils/GenerateChildWallet";
import { Typography } from "antd";

const { Text } = Typography;

export default ({
  nodeAddressConfigMap,
  setNodeAddressConfigMap,
  finishCallback
}: {
  nodeAddressConfigMap: {
    [id: string]: {
      addr: string,
      address?: string,
      privKey?: string
    }
  },
  setNodeAddressConfigMap: (nodeAddressConfigMap: {
    [id: string]: {
      addr: string,
      address?: string,
      privKey?: string
    }
  }) => void,
  finishCallback: ( childWalletResultWallet : any ) => void
}) => {
  const childWalletResult = useActiveAccountChildWallets(SupportChildWalletType.MN, Object.keys(nodeAddressConfigMap).length * 2 );
  useEffect(() => {

    if (!childWalletResult || childWalletResult.loading) return;
    console.log("[childWalletResult] :: >>", childWalletResult);

    const wallets = childWalletResult.wallets;
    const unusedAddresses = Object.keys(wallets).filter(
      a => !wallets[a].exist
    );

    let unusedIndex = 0;
    const newMap = { ...nodeAddressConfigMap };

    Object.keys(newMap).forEach(id => {
      const configAddr = newMap[id].addr;

      if (wallets[configAddr]) {
        newMap[id] = {
          ...newMap[id],
          address: configAddr,
          privKey: wallets[configAddr].path
        };
      } else {
        const unusedAddr = unusedAddresses[unusedIndex++];
        if (unusedAddr) {
          newMap[id] = {
            ...newMap[id],
            address: unusedAddr,
            privKey: wallets[unusedAddr].path
          };
        }
      }
    });
    setNodeAddressConfigMap(newMap);
    finishCallback( childWalletResult.wallets );

  }, [
    childWalletResult?.loading,
    childWalletResult?.wallets,
    nodeAddressConfigMap,
    finishCallback
  ]);

  return <>
    <Text>正在加载主节点子钱包，请稍候...</Text>
  </>

}
