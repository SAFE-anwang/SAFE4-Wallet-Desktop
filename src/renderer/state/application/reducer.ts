import { createReducer } from '@reduxjs/toolkit';
import {
  applicationInit,
  applicationActionUpdateAtCreateWallet,
  applicationBlockchainUpdateBlockNumber,
  applicationActionConfirmedMnemonic,
  applicationDataUpdate,
} from './action';


export interface IApplicationState {
  action:{
    // 保存创建的助记词变量
    newMnemonic : string | undefined ,
    // 标识正在创建钱包的变量
    atCreateWallet : boolean
  }
  control:{

  }
  blockchain : {
    networkId : "SAFE4" ,
    blockNumber : number,
  }
  data : {
    [key:string]  : any
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
  builder.addCase(applicationInit, (state, { payload : { web3Endpoint } }) => {

  })

  .addCase(applicationDataUpdate , ( state , { payload : { nodeServerPath , resourcePath } } ) => {
    state.data[ "nodeServerPath" ] = nodeServerPath;
    state.data[ "resourcePath" ] = resourcePath;
  })

  .addCase(applicationBlockchainUpdateBlockNumber , ( state , {payload}) => {
    return {
      ...state ,
      blockchain:{
        ...state.blockchain ,
        blockNumber : payload
      }
    }
  })

  .addCase(applicationActionConfirmedMnemonic , ( state , {payload}) => {
    return {
      ...state ,
      action : {
        ...state.action ,
        newMnemonic : payload.mnemonic
      }
    }
  })

  .addCase(applicationActionUpdateAtCreateWallet , (state , {payload}) => {
    return {
      ...state ,
      action : {
        ...state.action ,
        atCreateWallet : payload
      }
    }
  })

})
