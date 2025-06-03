import { createReducer } from '@reduxjs/toolkit';
import { walletsClearWalletChildWallets, walletsInitList, walletsLoadKeystores, walletsLoadWalletNames, walletsUpdateActiveWallet, walletsUpdateUsedChildWalletAddress, walletsUpdateWalletChildWallets, walletsUpdateWalletName } from './action';
import { SupportChildWalletType } from '../../utils/GenerateChildWallet';

export interface ERC20Token {
  chainId: number,
  address: string,
  name: string,
  symbol: string,
  decimals: number
}

export interface WalletKeystore {
  mnemonic: string | undefined,
  password: string | undefined,
  path: string | undefined,
  privateKey: string,
  publicKey: string,
  address: string
}

export interface Wallet {
  publicKey: string,
  address: string,
  name: string,
}

export interface Wallets {
  networkId: "SAFE4",
  activeWallet: Wallet | null,
  keystores: WalletKeystore[],
  list: Wallet[],

  walletNames: {
    [address in string]: {
      name: string,
      active: boolean
    }
  },

  walletChildWallets: {
    [address in string]: {
      sn: {
        loading: boolean,
        wallets: {
          [address in string]: { path: string, exist: boolean , privateKey : string }
        }
      }
      mn: {
        loading: boolean,
        wallets: {
          [address in string]: { path: string, exist: boolean , privateKey : string }
        }
      }
    }
  },
  walletUsedAddress: string[],

}

const initialState: Wallets = {
  networkId: "SAFE4",
  activeWallet: null,
  keystores: [],
  list: [],
  walletNames: {},
  walletChildWallets: {},
  walletUsedAddress: []
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

  builder.addCase(walletsLoadKeystores, (state, { payload }) => {
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
    let walletNames = { ...state.walletNames };
    for (let i in keystores) {
      const keystore = keystores[i];
      const defaultNameTag = Number(i) + 1;
      const { address, publicKey } = keystore;
      list.push({
        publicKey: keystore.publicKey,
        address: keystore.address,
        // 默认以顺序作为钱包名称
        name: "Wallet-" + defaultNameTag,
      });
      if (!state.walletNames[address]) {
        walletNames[address] = {
          name: "Wallet-" + defaultNameTag,
          active: false
        }
      }
    }
    // 表示为新建钱包,则将新建的钱包作为活动钱包
    let activeWallet = state.activeWallet;
    if (payload.length == 1) {
      const publicKey = payload[0].publicKey;
      for (let i in list) {
        if (list[i].publicKey == publicKey) {
          activeWallet = list[i];
        }
      }
    } else if (!activeWallet && list.length > 0) {
      let activeAddressInNames = undefined;
      Object.keys(walletNames).forEach(address => {
        if (walletNames[address].active) {
          activeAddressInNames = address;
        }
      });
      if (activeAddressInNames) {
        for (let i in list) {
          if (list[i].address == activeAddressInNames) {
            activeWallet = list[i];
          }
        }
      } else {
        // 如果没有设置默认钱包,则将导入钱包的最后一个设为默认钱包.
        activeWallet = list[list.length - 1];
      }
    }

    return {
      ...state,
      keystores,
      list,
      activeWallet,
      walletNames
    }

  });

  builder.addCase(walletsInitList, (state, { payload }) => {
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

  builder.addCase(walletsUpdateActiveWallet, (state, { payload }) => {
    const publicKey = payload;
    let activeWallet = null;
    for (let i in state.list) {
      if (state.list[i].publicKey == publicKey) {
        activeWallet = state.list[i]
      }
    }
    return {
      ...state,
      activeWallet
    }
  })

  builder.addCase(walletsLoadWalletNames, (state, { payload }) => {
    const walletNames: {
      [address in string]: {
        name: string,
        active: boolean
      }
    } = state.walletNames ?? {};
    payload.forEach(({ address, name, active }) => {
      walletNames[address] = { name, active };
    });
    state.walletNames = walletNames;
  })

  builder.addCase(walletsUpdateWalletName, (state, { payload }) => {
    const { address, name } = payload;
    state.walletNames[address].name = name;
  });

  builder.addCase(walletsUpdateWalletChildWallets, (state, { payload }) => {
    const { address, type, loading, result } = payload;
    const _childWallets = state.walletChildWallets[address] ? { ...state.walletChildWallets[address] } : {
      mn: {
        loading: true,
        wallets: {}
      },
      sn: {
        loading: true,
        wallets: {}
      }
    };
    if (type == SupportChildWalletType.SN) {
      _childWallets.sn.loading = loading;
    } else {
      _childWallets.mn.loading = loading;
    }
    if (result) {
      Object.keys(result.map).forEach(childAddress => {
        if (type == SupportChildWalletType.SN) {
          _childWallets.sn.wallets[childAddress] = {
            path: result.map[childAddress].path,
            exist: result.map[childAddress].exist,
            privateKey:  result.map[childAddress].privateKey,
          }
        } else {
          _childWallets.mn.wallets[childAddress] = {
            path: result.map[childAddress].path,
            exist: result.map[childAddress].exist,
            privateKey:  result.map[childAddress].privateKey,
          }
        }
      });
    }
    state.walletChildWallets[address] = _childWallets;
  });

  builder.addCase(walletsUpdateUsedChildWalletAddress, (state, { payload }) => {
    const { address, used } = payload;
    if (address && used) {
      state.walletUsedAddress.push(address);
    }
  });

  builder.addCase(walletsClearWalletChildWallets, (state, _) => {
    state.walletChildWallets = {};
  })

});








