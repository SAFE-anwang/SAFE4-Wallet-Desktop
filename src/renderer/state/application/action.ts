import { createAction } from '@reduxjs/toolkit';

export const Application_Init = createAction<{
  blockNumber : string ,
  accounts : string[]
}>("Application_Init");

export const Application_Update_BlockNumber = createAction<string>
("Application_Update_BlockNumber")
