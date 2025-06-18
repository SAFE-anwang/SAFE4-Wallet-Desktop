import { FunctionFragment, Interface } from "ethers/lib/utils";
import { SysContractABI, SystemContract } from "./SystemContracts";
import { Application_Crosschain, Application_Crosschain_Pool_BSC, Application_Crosschain_Pool_ETH, Application_Crosschain_Pool_MATIC, Safe4NetworkChainId, SafeswapV2FactoryAddreess, SafeswapV2RouterAddress } from "../config";
import { ethers } from "ethers";
import ApplicationContractAbiConfig from "./ApplicationContractAbiConfig";
import { SafeswapV2ABI, SafeswapV2Contract } from "./SafeswapV2Contracts";


export enum SupportAccountManagerFunctions {
  Deposit = "deposit",              // function deposit(address _to, uint _lockDay) external payable returns (uint);
  WithdrawByID = "withdrawByID",    // function withdrawByID(uint[] memory _ids) external returns(uint);
  Withdraw = "withdraw",            // function withdraw() external returns (uint);
  BatchDeposit4One = "batchDeposit4One", // function batchDeposit4One(address _to, uint _times, uint _spaceDay, uint _startDay)
  AddLockDay = "addLockDay"         // function addLockDay(uint _id, uint _day)
}
export enum SupportSupernodeLogicFunctions {
  Register = "register",            // function register(bool _isUnion, address _addr, uint _lockDay, string memory _name, string memory _enode, string memory _description, uint _creatorIncentive, uint _partnerIncentive, uint _voterIncentive) external payable;
  AppendRegister = "appendRegister", // function appendRegister(address _addr, uint _lockDay) external payable;
  ChangeName = "changeName",      // function changeName(address _addr, address _name)
  ChangeAddress = "changeAddress",   // function changeAddress(address _addr, address _newAddr)
  ChangeEncode = "changeEnode",         // function changeEnode(address _addr, string memory _enode)
  ChangeDescription = "changeDescription",

  ChangeNameByID = "changeNameByID",      // function changeName(address _addr, address _name)
  ChangeEncodeByID = "changeEnodeByID",
  ChangeDescriptionByID = "changeDescriptionByID",
  ChangeIncentivePlan = "changeIncentivePlan"
}
export enum SupportSupernodeVoteFunctions {
  VoteOrApproval = "voteOrApproval", // function voteOrApproval(bool _isVote, address _dstAddr, uint[] memory _recordIDs)
  VoteOrApprovalWithAmount = "voteOrApprovalWithAmount" // function voteOrApprovalWithAmount(bool _isVote, address _dstAddr) external
}
export enum SupportMasternodeLogicFunctions {
  Register = "register",            // function register(bool _isUnion, address _addr, uint _lockDay, string memory _enode, string memory _description, uint _creatorIncentive, uint _partnerIncentive) external payable;
  AppendRegister = "appendRegister",// function appendRegister(address _addr, uint _lockDay) external payable;
  ChangeAddress = "changeAddress",   // function changeAddress(address _addr, address _newAddr)
  ChangeEncode = "changeEnode",         // function changeEnode(address _addr, string memory _enode)
  ChangeDescription = "changeDescription",

  ChangeEncodeByID = "changeEnodeByID",
  ChangeDescriptionByID = "changeDescriptionByID",
}
export enum SupportProposalFunctions {
  Create = "create",                //function create(string memory _title, uint _payAmount, uint _payTimes, uint _startPayTime, uint _endPayTime, string memory _description) external payable returns (uint);
  Vote = "vote"                     //function vote(uint _id, uint _voteResult) external;
}
export enum SupportSafe3Functions {
  RedeemAvailable = "redeemAvailable", // function redeemAvailable(bytes memory _pubkey, bytes memory _sig) external;
  RedeemLocked = "redeemLocked",       // function redeemLocked(bytes memory _pubkey, bytes memory _sig) external;
  RedeemMasterNode = "redeemMasterNode", // function redeemMasterNode(bytes memory _pubkey, bytes memory _sig, string memory _enode) external;

  BatchRedeemAvailable = "batchRedeemAvailable",
  BatchRedeemLocked = "batchRedeemLocked",
  BatchRedeemMasterNode = "batchRedeemMasterNode",// function batchRedeemMasterNode(bytes[] memory _pubkeys, bytes[] memory _sigs, string[] memory _enodes)
}

export enum SupportCrosschainFunctions {
  Safe2Eth = "eth2safe", // eth2safe(uint256 _value, string memory _safe_dst_address)
}

export enum SupportSafeswapV2RouterFunctions {

  // swapExactTokensForTokens
  // swapTokensForExactTokens

  // swapExactETHForTokens
  // swapETHForExactTokens
  // swapExactTokensForETH
  // swapTokensForExactETH

  SwapExactETHForTokens = "swapExactETHForTokens",  // swapExactETHForTokens( uint256 amountOutMin, address[] path, address to, uint256 deadline )
  SwapETHForExactTokens = "swapETHForExactTokens",  // swapETHForExactTokens( uint256 amountOut, address[] path, address to, uint256 deadline )
  SwapExactTokensForETH = "swapExactTokensForETH",  // swapExactTokensForETH( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
  SwapTokensForExactETH = "swapTokensForExactETH",  // swapTokensForExactETH( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )

  SwapExactTokensForTokens = "swapExactTokensForTokens", // swapExactTokensForTokens( uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline )
  SwapTokensForExactTokens = "swapTokensForExactTokens", // swapTokensForExactTokens( uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline )

  AddLiquidityETH = "addLiquidityETH", // addLiquidityETH( address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline )
  AddLiquidity = "addLiquidity", // addLiquidity( address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline )

  RemoveLiquidityETHWithPermit = "removeLiquidityETHWithPermit", // removeLiquidityETHWithPermit( address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s )
  RemoveLiquidityWithPermit = "removeLiquidityWithPermit", // removeLiquidityWithPermit( address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s )
}

export enum SupportSafeswapV2FacotryFunctions {


}

function decodeProposalFunctionData(IContract: Interface, fragment: FunctionFragment, input: string): {
  supportFuncName: string,
  inputDecodeResult: any
} | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportProposalFunctions.Vote:
      const vote = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: vote[0],
        _voteResult: vote[1]
      }
      break;
    case SupportProposalFunctions.Create:
      let create = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _title: create[0],
        _payAmount: create[1],
        _startPayTime: create[2],
        _endPayTime: create[3],
        _description: create[4]
      }
      break;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeMasternodeLogicFunctionData(IContract: Interface, fragment: FunctionFragment, input: string): {
  supportFuncName: string,
  inputDecodeResult: any
} | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportMasternodeLogicFunctions.Register:
      const register = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _isUnion: register[0],
        _addr: register[1],
      }
      break;
    case SupportMasternodeLogicFunctions.AppendRegister:
      let appendRegister = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: appendRegister[0],
        _lockDay: appendRegister[1]
      }
      break;
    case SupportMasternodeLogicFunctions.ChangeAddress:
      let changeAddress = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeAddress[0],
        _newAddr: changeAddress[1]
      }
      break;
    case SupportMasternodeLogicFunctions.ChangeEncode:
      let changeEnode = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeEnode[0],
      }
      break;
    case SupportMasternodeLogicFunctions.ChangeDescription:
      let changeDescription = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeDescription[0],
      }
      break;
    case SupportMasternodeLogicFunctions.ChangeEncodeByID:
      let changeEnodeByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeEnodeByID[0],
      }
      break;
    case SupportMasternodeLogicFunctions.ChangeDescriptionByID:
      let changeDescriptionByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeDescriptionByID[0],
      }
      break;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeSupernodeLogicFunctionData(IContract: Interface, fragment: FunctionFragment, input: string): {
  supportFuncName: string,
  inputDecodeResult: any
} | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportSupernodeLogicFunctions.Register:
      const register = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _isUnion: register[0],
        _addr: register[1],
      }
      break;
    case SupportSupernodeLogicFunctions.AppendRegister:
      let appendRegister = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: appendRegister[0],
        _lockDay: appendRegister[1]
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeName:
      let changeName = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeName[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeAddress:
      let changeAddress = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeAddress[0],
        _newAddr: changeAddress[1]
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeEncode:
      let changeEnode = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeEnode[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeDescription:
      let changeDescription = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _addr: changeDescription[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeNameByID:
      let changeNameByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeNameByID[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeEncodeByID:
      let changeEnodeByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeEnodeByID[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeDescriptionByID:
      let changeDescriptionByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeDescriptionByID[0],
      }
      break;
    case SupportSupernodeLogicFunctions.ChangeIncentivePlan:
      let changeIncentivePlan = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _id: changeIncentivePlan[0],
      }
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeSupernodeVoteFunctionData(
  IContract: Interface, fragment: FunctionFragment, input: string): {
    supportFuncName: string,
    inputDecodeResult: any
  } | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportSupernodeVoteFunctions.VoteOrApproval:
      const voteOrApproval = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _isVote: voteOrApproval[0],
        _dstAddr: voteOrApproval[1],
      }
      break;
    case SupportSupernodeVoteFunctions.VoteOrApprovalWithAmount:
      const voteOrApprovalWithAmount = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _isVote: voteOrApprovalWithAmount[0],
        _dstAddr: voteOrApprovalWithAmount[1],
      }
      break;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;

}

function decodeAccountManagerFunctionData(
  IContract: Interface, fragment: FunctionFragment, input: string): {
    supportFuncName: string,
    inputDecodeResult: any
  } | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportAccountManagerFunctions.Deposit:
      const deposit = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _to: deposit[0],
        _lockDay: deposit[1].toNumber()
      }
      break;
    case SupportAccountManagerFunctions.WithdrawByID:
      let withdrawByID = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _ids: withdrawByID[0],
      }
      break;
    case SupportAccountManagerFunctions.Withdraw:
      formatDecodeResult = {

      }
      break;
    case SupportAccountManagerFunctions.BatchDeposit4One:
      const batchDeposit4One = IContract.decodeFunctionData(fragment, input);
      // function batchDeposit4One(address _to, uint _times, uint _spaceDay, uint _startDay)
      formatDecodeResult = {
        _to: batchDeposit4One[0],
        _times: batchDeposit4One[1].toNumber(),
        _spaceDay: batchDeposit4One[2].toNumber(),
        _startDay: batchDeposit4One[3].toNumber()
      }
      break;
    case SupportAccountManagerFunctions.AddLockDay:
      const addLockDay = IContract.decodeFunctionData(fragment, input);
      // function addLockDay(uint _id, uint _day)
      formatDecodeResult = {
        _id: addLockDay[0].toNumber(),
        _day: addLockDay[1].toNumber(),
      }
      break;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeSafe3FunctionData(
  IContract: Interface, fragment: FunctionFragment, input: string): {
    supportFuncName: string,
    inputDecodeResult: any
  } | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportSafe3Functions.RedeemAvailable:
    case SupportSafe3Functions.RedeemLocked:
    case SupportSafe3Functions.RedeemMasterNode:
    case SupportSafe3Functions.BatchRedeemAvailable:
    case SupportSafe3Functions.BatchRedeemLocked:
      const redeem = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _pubkeys: redeem[0],
        _sigs: redeem[1],
        _safe4TargetAddress: redeem[2]
      }
      break;
    case SupportSafe3Functions.BatchRedeemMasterNode:
      const masternodeRedeem = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _pubkeys: masternodeRedeem[0],
        _sigs: masternodeRedeem[1],
        _enodes: masternodeRedeem[2],
        _safe4TargetAddress: masternodeRedeem[3]
      }
      break;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeSafeswapV2RouterData(
  IContract: Interface, fragment: FunctionFragment, input: string): {
    supportFuncName: string,
    inputDecodeResult: any
  } | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportSafeswapV2RouterFunctions.SwapExactETHForTokens:
    case SupportSafeswapV2RouterFunctions.SwapETHForExactTokens:
    case SupportSafeswapV2RouterFunctions.SwapExactTokensForETH:
    case SupportSafeswapV2RouterFunctions.SwapTokensForExactETH:
    case SupportSafeswapV2RouterFunctions.SwapExactTokensForTokens:
    case SupportSafeswapV2RouterFunctions.SwapTokensForExactTokens:
    case SupportSafeswapV2RouterFunctions.AddLiquidityETH:
    case SupportSafeswapV2RouterFunctions.AddLiquidity:
    case SupportSafeswapV2RouterFunctions.RemoveLiquidityETHWithPermit:
    case SupportSafeswapV2RouterFunctions.RemoveLiquidityWithPermit:
      const swap = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = swap;
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

function decodeCrosschainPoolFunctionData(input: string) {
  try {
    const decodeData = ethers.utils.toUtf8String(input);
    const supportFuncName = decodeData.substring(0, decodeData.indexOf(":"));
    const data = decodeData.substring(decodeData.indexOf(":") + 1);
    return {
      supportFuncName: supportFuncName,
      inputDecodeResult: data
    };
  } catch (err) {
    return undefined
  }
}

function decodeCrosschainFunctionData(input: string) {
  const abi = ApplicationContractAbiConfig.CrosschainABI;
  const IContract = new Interface(abi);
  const methodId = input.substring(0, 10);
  try {
    const fragment = IContract.getFunction(methodId);
    let formatDecodeResult = undefined;
    if (fragment) {
      switch (fragment.name) {
        case SupportCrosschainFunctions.Safe2Eth:
          const safe2eth = IContract.decodeFunctionData(fragment, input);
          formatDecodeResult = {
            _value: safe2eth[0],
            _dst_address: safe2eth[1]
          }
          break;
      }
    }
    return formatDecodeResult ? {
      supportFuncName: fragment.name,
      inputDecodeResult: formatDecodeResult
    } : undefined;
  } catch (err) {
    return undefined;
  }
}

export function getCrosschainPoolInfo(address: string | undefined, from?: string): {
  isCrosschainPoolBSC: boolean, isCrosschainPoolETH: boolean, isCrosschainPoolMATIC: boolean
} {
  if (address && from) {
    const isCrosschainPoolBSC = Object.values(Application_Crosschain_Pool_BSC).includes(address)
      || Object.values(Application_Crosschain_Pool_BSC).includes(from);
    const isCrosschainPoolETH = Object.values(Application_Crosschain_Pool_ETH).includes(address)
      || Object.values(Application_Crosschain_Pool_ETH).includes(from);
    const isCrosschainPoolMATIC = Object.values(Application_Crosschain_Pool_MATIC).includes(address)
      || Object.values(Application_Crosschain_Pool_MATIC).includes(from);
    return {
      isCrosschainPoolBSC, isCrosschainPoolETH, isCrosschainPoolMATIC
    }
  }
  return {
    isCrosschainPoolBSC: false, isCrosschainPoolETH: false, isCrosschainPoolMATIC: false
  };
}

export function isCrosschainPoolTransaction(address: string | undefined, from?: string) {
  const {
    isCrosschainPoolBSC, isCrosschainPoolETH, isCrosschainPoolMATIC
  } = getCrosschainPoolInfo(address, from);
  return isCrosschainPoolBSC || isCrosschainPoolETH || isCrosschainPoolMATIC;
}

export default (address: string | undefined, input: string | undefined, from?: string): {
  supportFuncName: string,
  inputDecodeResult: any
} | undefined => {
  if (!input) {
    return undefined;
  }
  if (isCrosschainPoolTransaction(address, from)) {
    return decodeCrosschainPoolFunctionData(input);
  }
  if (address == Application_Crosschain[Safe4NetworkChainId.Testnet]
    || address == Application_Crosschain[Safe4NetworkChainId.Mainnet]
  ) {
    return decodeCrosschainFunctionData(input);
  }

  // For SafeswapV2Router / SafeswapV2Factory
  if (Object.values(SafeswapV2Contract).some(addr => addr == address)) {
    try {
      const abi = SafeswapV2ABI[address as unknown as SafeswapV2Contract];
      const IContract = new Interface(abi);
      const methodId = input.substring(0, 10);
      const fragment = IContract.getFunction(methodId);
      if (fragment) {
        switch (address) {
          case SafeswapV2RouterAddress:
            return decodeSafeswapV2RouterData(IContract, fragment, input);
          default:
            return undefined;
        }
      }
    } catch (err) {
      return undefined;
    }
  }


  if (!Object.values(SystemContract).some(addr => addr == address)) {
    return undefined;
  }
  try {
    const abi = SysContractABI[address as SystemContract];
    const IContract = new Interface(abi);
    const methodId = input.substring(0, 10);
    const fragment = IContract.getFunction(methodId);
    if (fragment) {
      switch (address) {
        case SystemContract.AccountManager:
          return decodeAccountManagerFunctionData(IContract, fragment, input);
        case SystemContract.SuperNodeLogic:
          return decodeSupernodeLogicFunctionData(IContract, fragment, input);
        case SystemContract.SNVote:
          return decodeSupernodeVoteFunctionData(IContract, fragment, input);
        case SystemContract.MasterNodeLogic:
          return decodeMasternodeLogicFunctionData(IContract, fragment, input);
        case SystemContract.Proposal:
          return decodeProposalFunctionData(IContract, fragment, input);
        case SystemContract.SAFE3:
          return decodeSafe3FunctionData(IContract, fragment, input);
        default:
          return undefined;
      }
    }
  } catch (err) {
    return undefined;
  }
}



