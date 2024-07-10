import { useMemo } from "react";
import { useWalletsActiveAccount, useWalletsList, useWalletsWalletNames } from "../state/wallets/hooks";

export default ( address : string | undefined ) : string | undefined => {
  const walletNames = useWalletsWalletNames();
  return walletNames && address && walletNames[address] ? walletNames[address].name : undefined;
}

export function isLocalWallet( address : string | undefined ) : { isLocal : boolean , isActive : boolean , name : string | undefined  } {
  const walletList = useWalletsList();
  const walletNames = useWalletsWalletNames();
  const activeAccount = useWalletsActiveAccount();
  const isLocal = useMemo( () => {
    let isLocal = false;
    walletList.forEach( wallet => {
      if ( wallet.address == address ){
        isLocal = true;
      }
    });
    return isLocal;
  } , [ address , walletList ] );
  const isActive = useMemo( () => {
    return activeAccount == address
  } , [activeAccount,address] );
  return {
    isLocal ,
    isActive ,
    name : walletNames && address && walletNames[address] ? walletNames[address].name : undefined
  }
}
