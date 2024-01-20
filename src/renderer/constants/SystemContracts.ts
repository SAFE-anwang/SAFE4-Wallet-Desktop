import SystemContractAbiConfig from "./SystemContractAbiConfig";

export enum EmptyContract {
  EMPTY = "0x0000000000000000000000000000000000000000"
}

export enum SystemContract {
  SystemProperty      = "0x0000000000000000000000000000000000001000",
  AccountManager      = "0x0000000000000000000000000000000000001010",
  MasterNodeStorage   = "0x0000000000000000000000000000000000001020",
  MasterNodeLogic     = "0x0000000000000000000000000000000000001025",
  SuperNodeStorage    = "0x0000000000000000000000000000000000001030",
  SuperNodeLogic      = "0x0000000000000000000000000000000000001035",
  SNVote              = "0x0000000000000000000000000000000000001040",
  MasterNodeState     = "0x0000000000000000000000000000000000001050",
  SuperNodeState      = "0x0000000000000000000000000000000000001060",
  Proposal            = "0x0000000000000000000000000000000000001070",
  SystemReward        = "0x0000000000000000000000000000000000001080",
  SAFE3               = "0x0000000000000000000000000000000000001090",
  MultiCall           = "0x0000000000000000000000000000000000001100"
}

export const SysContractABI: { [address in SystemContract]: string } = {
  [SystemContract.SystemProperty]     : SystemContractAbiConfig.PropertyABI,
  [SystemContract.AccountManager]     : SystemContractAbiConfig.AccountManagerABI,
  [SystemContract.MasterNodeStorage]  : SystemContractAbiConfig.MasterNodeStorageABI,
  [SystemContract.MasterNodeLogic]    : SystemContractAbiConfig.MasterNodeLogicABI,
  [SystemContract.SuperNodeStorage]   : SystemContractAbiConfig.SuperNodeStorageABI,
  [SystemContract.SuperNodeLogic]     : SystemContractAbiConfig.SuperNodeLogicABI,
  [SystemContract.SNVote]             : SystemContractAbiConfig.SNVoteABI,
  [SystemContract.MasterNodeState]    : SystemContractAbiConfig.MasterNodeStateABI,
  [SystemContract.SuperNodeState]     : SystemContractAbiConfig.SuperNodeStateABI,
  [SystemContract.Proposal]           : SystemContractAbiConfig.ProposalABI,
  [SystemContract.SystemReward]       : SystemContractAbiConfig.SystemRewardABI,
  [SystemContract.SAFE3]              : SystemContractAbiConfig.Safe3ABI,
  [SystemContract.MultiCall]          : SystemContractAbiConfig.MulticallABI
}
