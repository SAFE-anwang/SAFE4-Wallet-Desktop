import { createAction } from '@reduxjs/toolkit';
import { AfterSetPasswordTODO } from './reducer';

export const applicationBlockchainUpdateBlockNumber = createAction<{ blockNumber: number, timestamp: number }>
  ("application/blockchainUpdateBlockNumber")

export const applicationDataLoaded = createAction<{
  path: {
    resource: string,
    data: string,
    keystores: string,
    database: string
  }
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
