import { createReducer } from '@reduxjs/toolkit';
import {
  applicationInit,
  applicationActionUpdateAtCreateWallet,
  applicationBlockchainUpdateBlockNumber,
  applicationActionConfirmedMnemonic,
  applicationDataUpdate,
  applicationControlVoteSupernode,
  applicationUpdateSupernodeAddresses,
  applicationControlAppendMasternode,
  applicationUpdateWalletTab,
  applicationControlVoteProposal,
  applicationActionConfirmedImport,
  applicationUpdateWeb3Rpc,
} from './action';
import { SupernodeInfo } from '../../structs/Supernode';

import Config from "../../config"

export interface IApplicationState {
  action:{
    // 保存创建的助记词变量
    newMnemonic : string | undefined ,
    // 标识正在创建钱包的变量
    atCreateWallet : boolean,
    // 导入钱包时使用的传递变量
    importWallet ?: {
      importType : string,
      mnemonic ?: string,
      password ?: string,
      path ?: string,
      privateKey ?: string,
      address ?: string
    }
  }
  control:{
    vote ?: string ,
    supernodeAppend ?: string
    masternodeAppend ?: string,
    proposalId ?: number,
    walletTab ?: string,
  }
  supernodeAddresses : string[],
  blockchain : {
    networkId : "SAFE4" ,
    blockNumber : number,
    timestamp : number , 
    web3rpc:{
      chainId : number, 
      endpoint : string
    }
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
  supernodeAddresses : [],
  blockchain:{
    networkId : "SAFE4",
    blockNumber: 0,
    timestamp : 0 , 
    web3rpc : {
      endpoint : Config.Default_Web3_Endpoint,
      chainId  : 6666666
    }
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
    const {blockNumber , timestamp} = payload;
    return {
      ...state ,
      blockchain:{
        ...state.blockchain ,
        blockNumber,
        timestamp
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

  .addCase(applicationActionConfirmedImport , ( state , {payload}) => {
    return {
      ...state ,
      action : {
        ...state.action ,
        importWallet : payload
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

  .addCase(applicationControlVoteProposal , ( state , { payload } ) => {
    return {
      ...state ,
      control : {
        ...state.control,
        proposalId : payload
      }
    }
  })

  .addCase(applicationControlAppendMasternode , ( state , { payload } ) => {
    return {
      ...state ,
      control : {
        ...state.control,
        masternodeAppend : payload
      }
    }
  })

  .addCase(applicationUpdateSupernodeAddresses , (state , {payload}) => {
    state.supernodeAddresses = payload;
  })

  .addCase(applicationUpdateWalletTab , (state , {payload}) => {
    state.control.walletTab = payload;
  })

  .addCase(applicationUpdateWeb3Rpc , (state , {payload}) => {
    state.blockchain.web3rpc = payload;
  })

})
