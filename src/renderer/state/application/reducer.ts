import { createReducer } from '@reduxjs/toolkit';
import { Application_Init, Application_Update_BlockNumber } from './action';

export interface IApplicationState {
  blockNumber : string,
  accounts : any[]
}

const initialState: IApplicationState = {
  blockNumber: "0",
  accounts: []
}

export default createReducer(initialState, (builder) => {

  builder.addCase(Application_Init, (state, { payload }) => {
    const { blockNumber , accounts } = payload;
    return {
      ...state ,
      blockNumber,
      accounts
    }
  })

  builder.addCase(Application_Update_BlockNumber, (state, { payload }) => {
    state.blockNumber = payload ;
    return state;
  })

})
