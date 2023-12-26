import { createReducer } from '@reduxjs/toolkit';
import { Application_Action_Update_AtCreateWallet, Application_Blockchain_Update_ActiveWallet, Application_Confirmed_Mnemonic, Application_Init } from './action';

export interface IApplicationState {
  action:{
    newMnemonic : string | undefined ,
    atCreateWallet : boolean
  }
  control:{

  }
  blockchain : {
    networkId : "SAFE4" ,
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

  .addCase(Application_Action_Update_AtCreateWallet , (state , {payload}) => {
    return {
      ...state ,
      action : {
        ...state.action ,
        atCreateWallet : payload
      }
    }
  })

})
