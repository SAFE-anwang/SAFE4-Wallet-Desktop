import { createReducer } from '@reduxjs/toolkit';
import { Application_Confirmed_Mnemonic, Application_Init } from './action';
import { Wallet } from '../wallets/reducer';

export interface IApplicationState {
  action:{
    newMnemonic : string | undefined ,
    atCreateWallet : boolean
  }
  control:{

  }
  blockchain : {
    networkId : "SAFE4" ,
    activeWallet : Wallet | undefined ,
    blockNumber : string,
  }
  data : {

  }
}

const initialState: IApplicationState = {
  action : {
    newMnemonic : undefined,
    atCreateWallet : false
  },
  control:{

  },
  blockchain:{
    networkId : "SAFE4",
    activeWallet : undefined ,
    blockNumber: "0"
  },
  data:{

  }
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

  .addCase(Application_Confirmed_Mnemonic , ( state , {payload}) => {
    return {
      ...state ,
      action : {
        ...state.action ,
        newMnemonic : payload.mnemonic
      }
    }
  })


})
