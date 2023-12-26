import { ActionCreatorWithPreparedPayload, createAction } from "@reduxjs/toolkit";
import { WalletKeystore } from "./reducer";
import Wallet from "ethereumjs-wallet";

export const Wallets_Load_Keystores = createAction<WalletKeystore[]>(
  "Wallets_Load_Keystores"
);

export const Wallets_Init_List = createAction<Wallet[]>(
  "Wallets_Init_List"
);


