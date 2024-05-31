import { ContractCompileVO, ContractVO, POST, PageQueryDTO, PageResponseVO } from ".";
import config from "../config";

const { Safescan_Api } = config;

export async function fetchContracts(params: { address: string } | PageQueryDTO): Promise<PageResponseVO<ContractVO>> {
  const serverResponse = await POST(`${Safescan_Api}/contracts`, params);
  if (serverResponse.data && serverResponse.data.records) {

  } else {
    throw new Error("Call SafeScan Error1:");
  }
  return serverResponse.data;
}

export async function fetchContractCompile(params: { address: string }): Promise<ContractCompileVO> {
  const serverResponse = await POST(`${Safescan_Api}/contracts/${params.address}/compile`, params);
  return serverResponse.data;
}
