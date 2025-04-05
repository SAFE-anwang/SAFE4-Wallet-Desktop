
import { Contract } from '@ethersproject/contracts'

export interface CallMulticallAggregateContractCall {
  contract: Contract,
  functionName: string,
  params: any[],
  result?: any
}

export function SyncCallMulticallAggregate(
  multicallContract: any,
  contractCalls: CallMulticallAggregateContractCall[]
) {
  const calls = contractCalls.map(contractCall => {
    const { contract, functionName, params } = contractCall;
    const fragment = contract.interface.getFunction(functionName);
    const call = [
      contract.address,
      contract.interface.encodeFunctionData(fragment, params)
    ];
    return call;
  });
  return new Promise(async (resolve, reject) => {
    const data = await multicallContract.callStatic.aggregate(calls);
    const { blockNumber, returnData } = data;
    contractCalls.forEach((contractCall, index) => {
      const raw = returnData[index];
      const { contract, functionName } = contractCalls[index];
      const fragment = contract.interface.getFunction(functionName);
      const result = contract.interface.decodeFunctionResult(fragment, raw);
      contractCall.result = result[0];
    });
    resolve(calls);
  });
}

export default (
  multicallContract: any,
  contractCalls: CallMulticallAggregateContractCall[],
  callback: () => void,
  errCallback?: (err: any) => void
) => {
  const calls = contractCalls.map(contractCall => {
    const { contract, functionName, params } = contractCall;
    const fragment = contract.interface.getFunction(functionName);
    const call = [
      contract.address,
      contract.interface.encodeFunctionData(fragment, params)
    ];
    return call;
  });
  multicallContract.callStatic.aggregate(calls).then((data: any) => {
    const { blockNumber, returnData } = data;
    contractCalls.forEach((contractCall, index) => {
      const raw = returnData[index];
      const { contract, functionName } = contractCalls[index];
      const fragment = contract.interface.getFunction(functionName);
      const result = contract.interface.decodeFunctionResult(fragment, raw);
      contractCall.result = result.length == 1 ? result[0] : result;
    });
    callback();
  }).catch(( err : any ) => {
    if ( errCallback ) errCallback(err);
  });
}
