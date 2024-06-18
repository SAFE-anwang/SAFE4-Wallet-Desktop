import { ContractCompileVO, ContractVO, ContractVOFormat, POST, PageQueryDTO, PageResponseVO } from ".";


export async function fetchContracts( API : string , params: { address: string } | PageQueryDTO): Promise<PageResponseVO<ContractVO>> {
  const serverResponse = await POST(`${API}/contracts`, params);
  if (serverResponse.data && serverResponse.data.records) {
    serverResponse.data.records = serverResponse.data.records.map(
      ContractVOFormat
    )
  } else {
    throw new Error("Call SafeScan Error1:");
  }
  return serverResponse.data;
}

export async function fetchContractCompile(API : string , params: { address: string }): Promise<ContractCompileVO> {
  const serverResponse = await POST(`${API}/contracts/${params.address}/compile`, params);
  return serverResponse.data;
}

export async function fetchContractVerifyForSingle( API : string , params: {
  contractAddress: string ,
  compileVersion : string ,
  contractSourceCode : string,
  evmVersion : string,
  optimizerEnabled : boolean,
  optimizerRuns : number
}): Promise< any > {
  const serverResponse = await POST(`${API}/verify/contract/compile`, {
    ...params,
    compileType : "single"
  });
  return serverResponse.data;
}
