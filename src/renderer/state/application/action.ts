import { createAction } from '@reduxjs/toolkit';

export const applicationInit = createAction<{
  web3Endpoint: string
}>("application/init");

export const applicationBlockchainUpdateBlockNumber = createAction<{blockNumber:number,timestamp:number}>
  ("application/blockchainUpdateBlockNumber")

export const applicationDataUpdate = createAction<{
  resource: string,
  data: string,
  keystores: string,
  database: string
}>
  ("Application_Update_SysInfo")

export const applicationActionConfirmedMnemonic = createAction<{
  mnemonic: string
}>("application/actionConfirmedMnemonic");

export const applicationActionConfirmedImport = createAction<{
  importType : string ,
  mnemonic ?: string ,
  password ?: string ,
  path ?: string,
  privateKey ?: string,
  address : string
}>("application/actionConfirmedImport");


export const applicationActionUpdateAtCreateWallet = createAction<boolean>(
  "application/actionUpdateAtCreateWallet"
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

export const applicationControlVoteProposal = createAction<number | undefined>(
  "application/controlVoteProposal"
)
