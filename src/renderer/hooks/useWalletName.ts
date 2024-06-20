import { useMemo } from "react";
import { useWalletsList, useWalletsWalletNames } from "../state/wallets/hooks";

export default ( address : string | undefined ) : string | undefined => {
  const walletNames = useWalletsWalletNames();
  return walletNames && address && walletNames[address] ? walletNames[address].name : undefined;
}

export function isLocalWallet( address : string | undefined ) : { isLocal : boolean , name : string | undefined  } {
  const walletList = useWalletsList();
  const walletNames = useWalletsWalletNames();
  const isLocal = useMemo( () => {
    let isLocal = false;
    walletList.forEach( wallet => {
      if ( wallet.address == address ){
        isLocal = true;
      }
    });
    return isLocal;
  } , [ address , walletList ] );
  return {
    isLocal ,
    name : walletNames && address && walletNames[address] ? walletNames[address].name : undefined
  }
}
