import { createReducer } from '@reduxjs/toolkit';
import {
  applicationInit,
  applicationActionUpdateAtCreateWallet,
  applicationBlockchainUpdateBlockNumber,
  applicationActionConfirmedMnemonic,
  applicationDataUpdate,
  applicationControlVoteSupernode,
} from './action';
import { SupernodeInfo } from '../../structs/Supernode';


export interface IApplicationState {
  action:{
    // 保存创建的助记词变量
    newMnemonic : string | undefined ,
    // 标识正在创建钱包的变量
    atCreateWallet : boolean
  }
  control:{
    vote ?: string
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

  .addCase(applicationDataUpdate , ( state , { payload : { resource,data,database,keystores } } ) => {
    state.data[ "resource" ] = resource;
    state.data[ "data" ] = data;
    state.data[ "database" ] = database;
    state.data[ "keystores" ] = keystores;
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

  .addCase(applicationControlVoteSupernode , ( state , { payload } ) => {
    return {
      ...state ,
      control : {
        ...state.control,
        vote : payload
      }
    }
  })

})
