import { Fragment, FunctionFragment, Interface } from "ethers/lib/utils";
import { SysContractABI, SystemContract } from "./SystemContracts";


export enum SupportAccountManagerFunctions {
  Deposit = "deposit",              // function deposit(address _to, uint _lockDay) external payable returns (uint);
  WithdrawByID = "withdrawByID",    // function withdrawByID(uint[] memory _ids) external returns(uint);
  Withdraw = "withdraw",            // function withdraw() external returns (uint);
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
        default:
          return undefined;
      }
    }
  } catch (err) {
    return undefined;
  }
}



