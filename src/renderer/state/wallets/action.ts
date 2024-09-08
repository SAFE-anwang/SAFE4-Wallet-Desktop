import { createAction } from "@reduxjs/toolkit";
import { WalletKeystore } from "./reducer";
import Wallet from "ethereumjs-wallet";
import { SupportChildWalletType } from "../../utils/GenerateChildWallet";

export const walletsLoadKeystores = createAction<WalletKeystore[]>(
  "wallets/loadKeystores"
);

export const walletsInitList = createAction<Wallet[]>(
  "wallets/initList"
);

export const walletsUpdateActiveWallet = createAction<string>(
  "wallets/updateActiveWallet"
)

export const walletsLoadWalletNames = createAction<{ address: string, name: string, active: boolean }[]>(
  "wallets/loadWalletNames"
)

export const walletsUpdateWalletName = createAction<{ address : string , name : string }>(
  "wallets/updateWalletName"
)

export const walletsUpdateWalletChildWallets = createAction<{ address : string , type : SupportChildWalletType , loading : boolean , result : {
  map : {
    [address : string] : {
      path : string , 
      exist : boolean
    }
  }
} }>(
  "wallets/updateWalletChildWallets"
)


