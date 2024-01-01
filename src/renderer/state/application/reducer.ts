import { createReducer } from '@reduxjs/toolkit';
import { 
  Application_Action_Update_AtCreateWallet, 
  Application_Blockchain_Update_BlockNumber, 
  Application_Confirmed_Mnemonic, 
  Application_Init 
} from './action';


export interface IApplicationState {
  action:{
    newMnemonic : string | undefined ,
    atCreateWallet : boolean
  }
  control:{

  }
  blockchain : {
    networkId : "SAFE4" ,
    blockNumber : number,
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
    blockNumber: 0,
  },
  data:{

  }
}

export default createReducer(initialState, (builder) => {
  builder.addCase(Application_Init, (state, { payload : { web3Endpoint } }) => {

  })

  .addCase(Application_Blockchain_Update_BlockNumber , ( state , {payload}) => {
    return {
      ...state ,
      blockchain:{
        ...state.blockchain ,
        blockNumber : payload
      }
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
