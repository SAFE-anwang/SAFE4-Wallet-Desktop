import { createReducer } from '@reduxjs/toolkit';
import { Application_Confirmed_Mnemonic, Application_Init, Application_New_Wallet, Application_Update_BlockNumber, Application_Update_SysInfo } from './action';

export interface Wallet {
  mnemonic : string,
  seed : string,
  privateKey : string,
  publicKey : string,
  address : string,
}

export interface IApplicationState {
  wallets : {
    newMnemonic : string | undefined,
    list : Wallet []
  },
  sysInfo : {
    node_serve_path : string 
  },
  blockNumber : string,
  accounts : any[]
}

const initialState: IApplicationState = {
  wallets : {
    newMnemonic : undefined , 
    list : [],
  },
  sysInfo : {
    node_serve_path : ""
  },
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

  builder.addCase(Application_Update_SysInfo, (state, { payload }) => {
    return {
      ...state , 
      sysInfo : payload
    }
  })

  builder.addCase( Application_Confirmed_Mnemonic , (state , { payload }) => {
    const wallets = state.wallets;
    wallets.newMnemonic = payload.mnemonic;
  })

  builder.addCase(Application_New_Wallet , (state , { payload }) => {
    state.wallets.list.push( payload );
    return {
      ...state
    }
  })

})
