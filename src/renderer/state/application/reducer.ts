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
  applicationSetPassword,
  applicationAddRpcConfig,
  applicationControlContractVO,
  applicationControlCompile,
  applicationControlDirectDeploy,
  applicationControlUpdateEditMasternodeId,
  applicationControlUpdateEditSupernodeId,
  applicationUpdateLanguage,
  applicationUpdateSafeswapTokens,
  applicationUpdateSafeswapSlippageTolerance,
} from './action';

import { ContractVO } from '../../services';
import { Token } from '@uniswap/sdk';

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

  encrypt?: {
    password?: string,
    salt?: string,
    iv?: string,
    ciphertext?: string
  },

  language: string,

  safeswap: {
    tokenA: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined,
    tokenB: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined
  } | undefined,
  SlippageTolerance: number,

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
  SlippageTolerance: 0.005
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
        action: {
          ...state.action,
          atCreateWallet: payload
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

    .addCase(applicationSetPassword, (state, { payload }) => {
      return {
        ...state,
        encrypt: {
          ...state.encrypt,
          password: payload
        }
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
      const { tokenA, tokenB } = payload;
      state.safeswap = {
        tokenA: tokenA ? { ...tokenA } : undefined,
        tokenB: tokenB ? { ...tokenB } : undefined,
      }
    })

    .addCase(applicationUpdateSafeswapSlippageTolerance, ( state, {payload} ) => {
      state.SlippageTolerance = payload;
    })

})
