import { createReducer } from '@reduxjs/toolkit';
import {
  applicationActionUpdateAtCreateWallet,
  applicationBlockchainUpdateBlockNumber,
  applicationActionConfirmedMnemonic,
  applicationDataLoaded,
  applicationControlVoteSupernode,
  applicationUpdateSupernodeAddresses,
  applicationControlAppendMasternode,
  applicationUpdateWalletTab,
  applicationControlVoteProposal,
  applicationActionConfirmedImport,
  applicationUpdateWeb3Rpc,
  applicationUpdateAfterSetPasswordTODO,
  applicationAddRpcConfig,
  applicationControlContractVO,
  applicationControlCompile,
  applicationControlDirectDeploy,
  applicationControlUpdateEditMasternodeId,
  applicationControlUpdateEditSupernodeId,
  applicationUpdateLanguage,
  applicationUpdateSafeswapTokens,
  applicationUpdateSafeswapSlippageTolerance,
  applicationUpdateWalletUpdateVersion,
  applicationUpdateWalletUpdateIgore,
  applicationUpdateSNAddresses,
  applicationRemoveRpcConfig,
  applicationLoadSSHConfigs,
  applicationSaveOrUpdateSSHConfigs,
  applicationSetInitWalletPassword,
} from './action';

import { ContractVO, WalletVersionVO } from '../../services';
import { Token } from '@uniswap/sdk';
import { SSH2ConnectConfig } from '../../../main/SSH2Ipc';
import { IPC_CHANNEL } from '../../config';
import { SSHConfigSignal, SSHConfig_Methods } from '../../../main/handlers/SSHConfigSignalHandler';

export const enum AfterSetPasswordTODO {
  CREATE = "create",
  IMPORT = "import",
  ENCRYPT = "encrypt"
}

export interface IApplicationState {
  action: {
    // 保存创建的助记词变量
    newMnemonic: string | undefined,
    // 标识正在创建钱包的变量
    atCreateWallet: boolean,
    // 导入钱包时使用的传递变量
    importWallet?: {
      importType: string,
      mnemonic?: string,
      password?: string,
      path?: string,
      privateKey?: string,
      address?: string
    },
    //
    afterSetPasswordTODO: AfterSetPasswordTODO
  }
  control: {
    vote?: string,
    supernodeAppend?: string
    masternodeAppend?: string,
    proposalId?: number,
    walletTab?: string,
    contractVO?: ContractVO,
    // 合约编译时存储的数据
    compile?: {
      compileResult: string,
      sourceCode: string,
      abi: string,
      bytecode: string,
      name: string,
      compileOption: {
        compileVersion: string,
        evmVersion: string,
        optimizer: {
          enabled: boolean,
          runs: number
        }
      }
    }
    directDeploy?: boolean,
    editMasternodeId?: number,
    editSupernodeId?: number
  }
  supernodeAddresses: string[],
  blockchain: {
    networkId: "SAFE4",
    blockNumber: number,
    timestamp: number,
    web3rpc?: {
      chainId: number,
      endpoint: string
    }
  }
  data: {
    [key: string]: any
  },
  rpcConfigs?: {
    chainId: number,
    endpoint: string
  }[],

  initWalletPassword?: string,
  encrypt?: {
    password?: string,
    salt?: string,
    iv?: string,
    ciphertext?: string
  },

  language: string,
  platform: string,

  WalletUpdate: {
    currentVersion: string,
    currentVersionCode: number,
    latestWallet?: WalletVersionVO,
    ignore: boolean,
  },

  SNAddresses?: {
    [chainId: number]: string[],
  }

  safeswap: {
    [chainId: number]: {
      tokenA: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined,
      tokenB: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined
    },
    action?: string
  } | undefined,
  SlippageTolerance: string,


  sshConfigMap: {
    [host: string]: SSH2ConnectConfig
  }

}

const initialState: IApplicationState = {
  action: {
    newMnemonic: undefined,
    atCreateWallet: false,
    afterSetPasswordTODO: AfterSetPasswordTODO.CREATE
  },
  control: {

  },
  supernodeAddresses: [],
  blockchain: {
    networkId: "SAFE4",
    blockNumber: 0,
    timestamp: 0,
  },
  data: {

  },
  language: "zh",
  safeswap: undefined,
  SlippageTolerance: "0.005",
  platform: "",
  WalletUpdate: {
    currentVersion: "2.0.6",
    currentVersionCode: 103,
    ignore: false
  },
  sshConfigMap: {}
}

export default createReducer(initialState, (builder) => {

  builder.addCase(applicationDataLoaded, (state, { payload: { path, rpcConfigs, appProps } }) => {
    const { resource, data, database, kys } = path;
    state.data["resource"] = resource;
    state.data["data"] = data;
    state.data["database"] = database;
    state.data["kys"] = kys;
    state.rpcConfigs = rpcConfigs;
    state.language = appProps.language;
    state.platform = appProps.platform;
  })

    .addCase(applicationBlockchainUpdateBlockNumber, (state, { payload }) => {
      const { blockNumber, timestamp } = payload;
      return {
        ...state,
        blockchain: {
          ...state.blockchain,
          blockNumber,
          timestamp
        }
      }
    })

    .addCase(applicationActionConfirmedMnemonic, (state, { payload }) => {
      return {
        ...state,
        action: {
          ...state.action,
          newMnemonic: payload.mnemonic
        }
      }
    })

    .addCase(applicationActionConfirmedImport, (state, { payload }) => {
      return {
        ...state,
        action: {
          ...state.action,
          importWallet: payload
        }
      }
    })

    .addCase(applicationActionUpdateAtCreateWallet, (state, { payload }) => {
      return {
        ...state,
        initWalletPassword: (state.initWalletPassword && !payload) ? undefined : state.initWalletPassword,
        action: {
          ...state.action,
          atCreateWallet: payload,
          newMnemonic: (state.action.newMnemonic && !payload) ? undefined : state.action.newMnemonic,
          importWallet: (state.action.importWallet && !payload) ? undefined : state.action.importWallet,
        }
      }
    })

    .addCase(applicationUpdateAfterSetPasswordTODO, (state, { payload }) => {
      return {
        ...state,
        action: {
          ...state.action,
          afterSetPasswordTODO: payload
        }
      }
    })

    .addCase(applicationSetInitWalletPassword, (state, { payload }) => {
      return {
        ...state,
        initWalletPassword: payload
      }
    })

    .addCase(applicationControlVoteSupernode, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          vote: payload
        }
      }
    })

    .addCase(applicationControlVoteProposal, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          proposalId: payload
        }
      }
    })

    .addCase(applicationControlAppendMasternode, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          masternodeAppend: payload
        }
      }
    })

    .addCase(applicationControlContractVO, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          contractVO: payload
        }
      }
    })

    .addCase(applicationControlCompile, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          compile: payload
        }
      }
    })

    .addCase(applicationControlDirectDeploy, (state, { payload }) => {
      return {
        ...state,
        control: {
          ...state.control,
          directDeploy: payload
        }
      }
    })

    .addCase(applicationUpdateSupernodeAddresses, (state, { payload }) => {
      state.supernodeAddresses = payload;
    })

    .addCase(applicationUpdateWalletTab, (state, { payload }) => {
      state.control.walletTab = payload;
    })

    .addCase(applicationUpdateWeb3Rpc, (state, { payload }) => {
      state.blockchain.web3rpc = payload;
    })

    .addCase(applicationAddRpcConfig, (state, { payload }) => {
      state.rpcConfigs?.push(payload);
    })

    .addCase(applicationRemoveRpcConfig, (state, { payload }) => {
      const _cache = state.rpcConfigs;
      state.rpcConfigs = _cache?.filter(rpcConfig => {
        return !(rpcConfig.endpoint == payload.endpoint);
      })
    })

    .addCase(applicationControlUpdateEditMasternodeId, (state, { payload }) => {
      state.control.editMasternodeId = payload;
    })

    .addCase(applicationControlUpdateEditSupernodeId, (state, { payload }) => {
      state.control.editSupernodeId = payload;
    })

    .addCase(applicationUpdateLanguage, (state, { payload }) => {
      state.language = payload;
    })

    .addCase(applicationUpdateSafeswapTokens, (state, { payload }) => {
      const { chainId, tokenA, tokenB, action } = payload;
      const _safeswap = state.safeswap ?? {};
      _safeswap[chainId] = {
        tokenA: tokenA ? { ...tokenA } : undefined,
        tokenB: tokenB ? { ...tokenB } : undefined,
      }
      _safeswap.action = action;
      state.safeswap = _safeswap;
    })

    .addCase(applicationUpdateSafeswapSlippageTolerance, (state, { payload }) => {
      state.SlippageTolerance = payload;
    })

    .addCase(applicationUpdateWalletUpdateVersion, (state, { payload }) => {
      state.WalletUpdate.latestWallet = payload;
    })

    .addCase(applicationUpdateWalletUpdateIgore, (state, { payload }) => {
      state.WalletUpdate.ignore = payload;
    })

    .addCase(applicationUpdateSNAddresses, (state, { payload }) => {
      const _snAddresses: { [chainId: number]: string[] } = {
        [payload.chainId]: payload.addresses
      };
      state.SNAddresses = _snAddresses;
    })

    .addCase(applicationLoadSSHConfigs, (state, { payload }) => {
      const _sshConfigMap: {
        [host: string]: SSH2ConnectConfig
      } = {};
      payload.forEach(config => {
        _sshConfigMap[config.host] = config;
      });
      state.sshConfigMap = { ..._sshConfigMap };
    })

    .addCase(applicationSaveOrUpdateSSHConfigs, (state, { payload }) => {
      const needUpdates: SSH2ConnectConfig[] = [];
      payload.filter(config => {
        const { host, port, username, password } = config;
        if (!state.sshConfigMap[host]) {
          needUpdates.push(config);
        } else {
          const _config = state.sshConfigMap[host];
          if (port != _config.port
            || username != _config.username
            || password != _config.password) {
            needUpdates.push(config);
          }
        }
      });
      const _sshConfigMap: {
        [host: string]: SSH2ConnectConfig
      } = {};
      needUpdates.forEach(config => {
        _sshConfigMap[config.host] = config;
      });
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [SSHConfigSignal, SSHConfig_Methods.saveOrUpdate, [needUpdates]]);
      state.sshConfigMap = {
        ...state.sshConfigMap,
        ..._sshConfigMap
      };
    })

})
