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

export const Application_New_Wallet = createAction<{
  mnemonic : string,
  seed : string,
  address : string,
  privateKey : string,
  publicKey : string
}>("Application_New_Wallet");
