import { createAction } from '@reduxjs/toolkit';
import { Wallet } from '../wallets/reducer';

export const Application_Init = createAction<{
  web3Endpoint : string
}>("Application_Init");

export const Application_Update_BlockNumber = createAction<string>
  ("Application_Update_BlockNumber")

export const Application_Update_SysInfo = createAction<{
  node_serve_path: string
}>
  ("Application_Update_SysInfo")

export const Application_Confirmed_Mnemonic = createAction<{
  mnemonic: string
}>("Application_Confirmed_Mnemonic");

export const Application_Action_Update_AtCreateWallet = createAction<boolean>(
  "Application_Action_Update_AtCreateWallet"
)

export const Application_Blockchain_Update_ActiveWallet = createAction<string>(
  "Application_Blockchain_Update_ActiveWallet"
)
