
import { Contract } from '@ethersproject/contracts'

export interface CallMulticallAggregateContractCall {
  contract: Contract,
  functionName: string,
  params: any[],
  result?: any
}

export default (
  multicallContract: any,
  contractCalls: CallMulticallAggregateContractCall[],
  callback: () => void
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
      contractCall.result = result[0];
    });
    callback();
  });
}
