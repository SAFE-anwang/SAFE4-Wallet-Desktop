import { createReducer } from '@reduxjs/toolkit';
import { walletsClearWalletChildWallets, walletsLoadWalletNames, walletsLoadWallets, walletsUpdateActiveWallet, walletsUpdateLocked, walletsUpdateUsedChildWalletAddress, walletsUpdateWalletChildWallets, walletsUpdateWalletName } from './action';
import { SupportChildWalletType } from '../../utils/GenerateChildWallet';

export interface ERC20Token {
  chainId: number,
  address: string,
  name: string,
  symbol: string,
  decimals: number
}

export interface WalletKeystore {

  _aes: string,
  _iv: string,
  _salt: string,

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
  path?: string
}

export interface Wallets {
  networkId: "SAFE4",
  activeWallet: Wallet | null,
  keystores: WalletKeystore[],
  list: Wallet[],
  locked: boolean,

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
          [address in string]: { path: string, exist: boolean, privateKey: string }
        }
      }
      mn: {
        loading: boolean,
        wallets: {
          [address in string]: { path: string, exist: boolean, privateKey: string }
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
  locked: true,
  walletNames: {},
  walletChildWallets: {},
  walletUsedAddress: [],
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

  builder.addCase(walletsLoadWallets, (state, { payload }) => {

    // 保持原有顺序的基础上去掉可能重复的数据.
    const _exists = new Set<string>();
    const _wallets = payload.filter(({ address }) => {
      if (_exists.has(address)) return false;
      _exists.add(address);
      return true;
    });

    const list: Wallet[] = [];
    let walletNames = { ...state.walletNames };
    for (let i in _wallets) {
      const defaultNameTag = Number(i) + 1;
      const { address, publicKey, path } = _wallets[i];
      list.push({
        publicKey,
        address,
        path,
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

    let activeWallet = state.activeWallet;
    if (!activeWallet && list.length > 0) {
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
      }
      if (!activeWallet) {
        activeWallet = list[list.length - 1];
      }
    } else {
      activeWallet = list[list.length - 1];
    }
    return {
      ...state,
      list,
      locked: !(list.length > 0),
      activeWallet,
      walletNames
    }
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
            privateKey: result.map[childAddress].privateKey,
          }
        } else {
          _childWallets.mn.wallets[childAddress] = {
            path: result.map[childAddress].path,
            exist: result.map[childAddress].exist,
            privateKey: result.map[childAddress].privateKey,
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

  builder.addCase(walletsUpdateLocked, (state, { payload }) => {
    state.locked = payload;
    if (payload == true) {
      window.electron.wallet.clean();
    }
  });

});








