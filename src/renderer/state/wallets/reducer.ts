import { createReducer } from '@reduxjs/toolkit';
import { Wallets_Init_List, Wallets_Load_Keystores } from './action';

export interface WalletKeystore {
  mnemonic : string | undefined,
  password : string | undefined,
  path     : string ,
  privateKey : string,
  publicKey  : string,
  address : string
}

export interface Wallet {
  publicKey  : string,
  address    : string,
  name       : string
}

export interface Wallets {
  networkId : "SAFE4",
  keystores : WalletKeystore[] ,
  list : Wallet[]
}

const initialState: Wallets = {
  networkId:"SAFE4",
  keystores:[],
  list:[]
}


const privateKeyContainsIn = ( privateKey : string , keystores : WalletKeystore[] ) : boolean => {
  for(let i in keystores){
    let _privateKey = keystores[i].privateKey;
    if (privateKey == _privateKey){
      return true;
    }
  }
  return false;
}

export default createReducer(initialState, (builder) => {

  builder.addCase( Wallets_Load_Keystores , ( state , { payload } ) => {
    const _keystores = [];
    for(let i in payload){
      let privateKey = payload[i].privateKey;
      if ( !privateKeyContainsIn(privateKey , _keystores) ){
        _keystores.push( payload[i] );
      }
    }
    let keystores = [];
    for(let i in state.keystores){
      keystores.push( state.keystores[i] );
    }
    if ( keystores.length == 0 ){
      keystores = payload;
    }else{
      for(let i in _keystores){
        let privateKey = _keystores[i].privateKey;
        if ( !privateKeyContainsIn(privateKey,state.keystores) ){
          keystores.push(_keystores[i]);
        }
      }
    }
    const list : Wallet[] = [];
    for( let i in keystores ){
      const keystore = keystores[i];
      const defaultNameTag = Number(i) + 1;
      list.push({
        publicKey : keystore.publicKey ,
        address   : keystore.address,
        name      : "Wallet-" + defaultNameTag
      });
    }
    return {
      ...state ,
      keystores,
      list
    }
  });

  builder.addCase( Wallets_Init_List , ( state , { payload }  ) => {
    const keystores = state.keystores;
    const list : Wallet[] = [];
    for( let i in keystores ){
      const keystore = keystores[i];
      list.push({
        publicKey : keystore.publicKey ,
        address   : keystore.address,
        name      : "Wallet - " + (i + 1)
      });
    }
    state.list = list;
  });

});








