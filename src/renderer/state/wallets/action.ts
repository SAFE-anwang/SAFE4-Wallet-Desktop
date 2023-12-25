import { ActionCreatorWithPreparedPayload, createAction } from "@reduxjs/toolkit";


export const Wallet_NewMnemonic = createAction<string>("wallets.newMnemonic");


export function FilterWalletsAction( method : string , params : any ) : ActionCreatorWithPreparedPayload<any , string> {
  return Wallet_NewMnemonic;
}

