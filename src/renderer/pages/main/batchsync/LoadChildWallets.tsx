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
      addr : string ,
      address ?: string,
      privKey ?: string
    }
  },
  setNodeAddressConfigMap: (nodeAddressConfigMap: {
    [id: string]: {
      addr : string ,
      address ?: string,
      privKey ?: string
    }
  }) => void ,
  finishCallback : () => void
}) => {
  const childWalletResult = useActiveAccountChildWallets(SupportChildWalletType.MN, Object.keys(nodeAddressConfigMap).length);
  useEffect(() => {
    if (childWalletResult && childWalletResult.loading == false) {
      const unusedAddresses = Object.keys(childWalletResult.wallets).filter(
        address => !childWalletResult.wallets[address].exist
      );
      Object.keys(nodeAddressConfigMap).forEach(id => {
        const { addr } = nodeAddressConfigMap[id];
        if (childWalletResult.wallets[addr]) {
          nodeAddressConfigMap[id].address = addr;
          nodeAddressConfigMap[id].privKey = childWalletResult.wallets[addr].privateKey;
        } else {
          const unusedAddr = unusedAddresses.shift();
          if (unusedAddr) {
            nodeAddressConfigMap[id] = {
              addr : addr,
              address: unusedAddr,
              privKey: childWalletResult.wallets[unusedAddr].privateKey
            }
          }
        }
      })
      setNodeAddressConfigMap({ ...nodeAddressConfigMap });
      finishCallback();
    }
  }, [childWalletResult, nodeAddressConfigMap])

  return <>

  </>

}
