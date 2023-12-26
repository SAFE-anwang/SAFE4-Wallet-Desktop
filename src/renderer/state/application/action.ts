import { createAction } from '@reduxjs/toolkit';


export const Application_Init = createAction<{
  blockNumber : string ,
  accounts : string[]
}>("Application_Init");

export const Application_Update_BlockNumber = createAction<string>
("Application_Update_BlockNumber")

export const Application_Update_SysInfo = createAction<{
  node_serve_path : string
}>
("Application_Update_SysInfo")

export const Application_Confirmed_Mnemonic = createAction<{
  mnemonic : string
}>("Application_Confirmed_Mnemonic");

export const Application_Finish_NewWallet = createAction<0>("Application_Finish_NewWallet");

export const Application_Update_AtCreateWallet = createAction<boolean>("Application_Update_AtCreateWallet")
