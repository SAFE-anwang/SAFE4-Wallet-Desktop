import { createAction } from "@reduxjs/toolkit";
import { WalletKeystore } from "./reducer";
import Wallet from "ethereumjs-wallet";

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




