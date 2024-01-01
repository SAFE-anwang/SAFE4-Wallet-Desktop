import { createReducer } from '@reduxjs/toolkit';
import { Wallets_Init_List, Wallets_Load_Keystores, Wallets_Update_ActiveWallet } from './action';

export interface WalletKeystore {
  mnemonic: string | undefined,
  password: string | undefined,
  path: string,
  privateKey: string,
  publicKey: string,
  address: string
}

export interface Wallet {
  publicKey: string,
  address: string,
  name: string
}

export interface Wallets {
  networkId: "SAFE4",
  activeWallet: Wallet | null,
  keystores: WalletKeystore[],
  list: Wallet[],
}

const initialState: Wallets = {
  networkId: "SAFE4",
  activeWallet : null,
  keystores: [],
  list: []
}


const privateKeyContainsIn = (privateKey: string, keystores: WalletKeystore[]): boolean => {
  for (let i in keystores) {
    let _privateKey = keystores[i].privateKey;
    if (privateKey == _privateKey) {
      return true;
    }
  }
  return false;
}

export default createReducer(initialState, (builder) => {

  builder.addCase(Wallets_Load_Keystores, (state, { payload }) => {
    const _keystores = [];
    for (let i in payload) {
      let privateKey = payload[i].privateKey;
      if (!privateKeyContainsIn(privateKey, _keystores)) {
        _keystores.push(payload[i]);
      }
    }
    let keystores = [];
    for (let i in state.keystores) {
      keystores.push(state.keystores[i]);
    }
    if (keystores.length == 0) {
      keystores = payload;
    } else {
      for (let i in _keystores) {
        let privateKey = _keystores[i].privateKey;
        if (!privateKeyContainsIn(privateKey, state.keystores)) {
          keystores.push(_keystores[i]);
        }
      }
    }
    const list: Wallet[] = [];
    for (let i in keystores) {
      const keystore = keystores[i];
      const defaultNameTag = Number(i) + 1;
      list.push({
        publicKey: keystore.publicKey,
        address: keystore.address,
        name: "Wallet-" + defaultNameTag
      });
    }

    // 表示为新建钱包,则将新建的钱包作为活动钱包
    let activeWallet = state.activeWallet;
    if ( payload.length == 1 ){
      const publicKey = payload[0].publicKey;
      for( let i in list ){
        if ( list[i].publicKey == publicKey ){
          activeWallet = list[i];
        }
      }
    }else if( !activeWallet && list.length > 0 ){
      // 如果没有设置默认钱包,则将导入钱包的最后一个设为默认钱包
      activeWallet = list[list.length-1];
    }

    return {
      ...state,
      keystores,
      list,
      activeWallet
    }

  });

  builder.addCase(Wallets_Init_List, (state, { payload }) => {
    const keystores = state.keystores;
    const list: Wallet[] = [];
    for (let i in keystores) {
      const keystore = keystores[i];
      list.push({
        publicKey: keystore.publicKey,
        address: keystore.address,
        name: "Wallet - " + (i + 1)
      });
    }
    state.list = list;
  });

  builder.addCase( Wallets_Update_ActiveWallet , (state , {payload}) => {
    const publicKey = payload;
    let activeWallet = null;
    for(let i in state.list){
      if ( state.list[i].publicKey == publicKey ){
        activeWallet = state.list[i]
      }
    }
    return {
      ...state , 
      activeWallet
    }
  })

});








