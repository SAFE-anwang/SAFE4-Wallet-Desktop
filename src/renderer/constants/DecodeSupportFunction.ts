import { Fragment, FunctionFragment, Interface } from "ethers/lib/utils";
import { SysContractABI, SystemContract } from "./SystemContracts";
import { DBAddressActivitySingalHandler, DB_AddressActivity_Actions } from "../../main/handlers/DBAddressActivitySingalHandler";


export enum SupportAccountManagerFunctions {
  Deposit = "deposit" , // function deposit(address _to, uint _lockDay) external payable returns (uint);
}

function decodeAccountManagerFunctionData(
  IContract: Interface, fragment: FunctionFragment, input: string): {
    supportFuncName: string,
    inputDecodeResult: any
  } | undefined {
  let formatDecodeResult = undefined;
  switch (fragment.name) {
    case SupportAccountManagerFunctions.Deposit:
      const decode = IContract.decodeFunctionData(fragment, input);
      formatDecodeResult = {
        _to: decode[0],
        _lockDay: decode[1].toNumber()
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
  if ( !input ){
    return undefined;
  }
  if (!Object.values(SystemContract).some( addr => addr == address )){
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
  }catch( err ){
    return undefined;
  }
}



