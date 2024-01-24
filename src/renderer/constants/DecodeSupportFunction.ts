import { Fragment, FunctionFragment, Interface } from "ethers/lib/utils";
import { SysContractABI, SystemContract } from "./SystemContracts";
import SupernodeVote from "../pages/main/supernodes/SupernodeVote";


export enum SupportAccountManagerFunctions {
  Deposit = "deposit",              // function deposit(address _to, uint _lockDay) external payable returns (uint);
  WithdrawByID = "withdrawByID",    // function withdrawByID(uint[] memory _ids) external returns(uint);
  Withdraw = "withdraw",            // function withdraw() external returns (uint);
}
export enum SupportSupernodeLogicFunctions {
  Register = "register",            // function register(bool _isUnion, address _addr, uint _lockDay, string memory _name, string memory _enode, string memory _description, uint _creatorIncentive, uint _partnerIncentive, uint _voterIncentive) external payable;
  AppendRegister = "appendRegister" // function appendRegister(address _addr, uint _lockDay) external payable;
}
export enum SupportSupernodeVoteFunctions {
  VoteOrApproval = "voteOrApproval" // function voteOrApproval(bool _isVote, address _dstAddr, uint[] memory _recordIDs)
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
    default:
      break;
  }
  return formatDecodeResult ? {
    supportFuncName: fragment.name,
    inputDecodeResult: formatDecodeResult
  } : undefined;
}

export default (address: string | undefined, input: string | undefined): {
  supportFuncName: string,
  inputDecodeResult: any
} | undefined => {
  if (!input) {
    return undefined;
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
        default:
          return undefined;
      }
    }
  } catch (err) {
    return undefined;
  }
}



