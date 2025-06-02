import { createAction } from '@reduxjs/toolkit';
import { AfterSetPasswordTODO } from './reducer';
import { ContractVO, WalletVersionVO } from '../../services';
import { Token } from '@uniswap/sdk';
import { SSH2ConnectConfig } from '../../../main/SSH2Ipc';

export const applicationBlockchainUpdateBlockNumber = createAction<{ blockNumber: number, timestamp: number }>
  ("application/blockchainUpdateBlockNumber")

export const applicationDataLoaded = createAction<{
  path: {
    resource: string,
    data: string,
    kys: string,
    database: string
  },
  rpcConfigs: {
    chainId: number,
    endpoint: string
  }[],
  appProps: any
}>("application/dataLoaded")

export const applicationActionConfirmedMnemonic = createAction<{
  mnemonic: string
}>("application/actionConfirmedMnemonic");

export const applicationActionConfirmedImport = createAction<{
  importType: string,
  mnemonic?: string,
  password?: string,
  path?: string,
  privateKey?: string,
  address: string
}>("application/actionConfirmedImport");


export const applicationActionUpdateAtCreateWallet = createAction<boolean>(
  "application/actionUpdateAtCreateWallet"
)
export const applicationUpdateAfterSetPasswordTODO = createAction<AfterSetPasswordTODO>(
  "application/updateAfterSetPasswordTODO"
)
export const applicationSetPassword = createAction<string>(
  "application/setPassword"
)

export const applicationControlVoteSupernode = createAction<string | undefined>(
  "application/controlVoteSupernode"
)

export const applicationControlAppendMasternode = createAction<string | undefined>(
  "application/controlAppendMasternode"
)

export const applicationUpdateSupernodeAddresses = createAction<string[]>(
  "application/updateSupernodeAddresses"
);

export const applicationUpdateWalletTab = createAction<string>(
  "application/updateWalletTab"
)

export const applicationUpdateWeb3Rpc = createAction<{ endpoint: string, chainId: number }>(
  "application/updateWeb3Rpc"
);

export const applicationControlVoteProposal = createAction<number | undefined>(
  "application/controlVoteProposal"
)

export const applicationAddRpcConfig = createAction<{ endpoint: string, chainId: number }>(
  "application/addRpcConfig"
);

export const applicationRemoveRpcConfig = createAction<{ endpoint: string }>(
  "application/removeRpcConfig"
);

export const applicationControlContractVO = createAction<ContractVO>(
  "application/controlContractVO"
)

export const applicationControlCompile = createAction<{
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
}>(
  "application/controlCompile"
)

export const applicationControlDirectDeploy = createAction<boolean>(
  "application/controlDirectDeploy"
)

export const applicationControlUpdateEditMasternodeId = createAction<number>(
  "application/controlUpdateEditMasternodeId"
)

export const applicationControlUpdateEditSupernodeId = createAction<number>(
  "application/controlUpdateEditSupernodeId"
)

export const applicationUpdateLanguage = createAction<string>(
  "application/updateLanguage"
)

export const applicationUpdateSafeswapTokens = createAction<{
  chainId: number,
  tokenA: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined,
  tokenB: { chainId: number, address: string, decimals: number, name?: string, symbol?: string } | undefined
}>(
  "application/updateSafeswapTokens"
)

export const applicationUpdateSafeswapSlippageTolerance = createAction<string>("application/updateSafeswapSlippageTolerance");

export const applicationUpdateWalletUpdateVersion = createAction<WalletVersionVO>("application/updateWalletUpdate");

export const applicationUpdateWalletUpdateIgore = createAction<boolean>("application/updateWalletUpdateIgnore");

export const applicationUpdateSNAddresses = createAction<{ chainId: number, addresses: string[] }>("application/updateSNAddresses");

export const applicationLoadSSHConfigs = createAction<SSH2ConnectConfig[]>("application/loadSSHConfigs");

export const applicationSaveOrUpdateSSHConfigs = createAction<SSH2ConnectConfig[]>("application/saveOrUpdateSSHConfigs");
