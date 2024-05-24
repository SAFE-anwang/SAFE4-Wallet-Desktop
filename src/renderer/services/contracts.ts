import { ContractVO, POST, PageQueryDTO, PageResponseVO } from ".";
import config from "../config";

const { Safescan_URL } = config;

export async function fetchContracts(params: { address: string } | PageQueryDTO): Promise<PageResponseVO<ContractVO>> {
  const serverResponse = await POST(`${Safescan_URL}:5005/contracts`, params);
  if (serverResponse.data && serverResponse.data.records) {

  }else{
    throw new Error("Call SafeScan Error1:");
  }
  return serverResponse.data;
}
