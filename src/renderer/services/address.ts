import { AddressActivityFormat, AddressActivityVO, AddressAnalyticVO, ApiResponse, POST, PageQueryDTO, PageResponseVO } from ".";
import config from "../config";

const { Safescan_Api } = config;

export async function fetchAddressActivity(params: { address: string, blockNumberStart: number, blockNumberEnd: number } | PageQueryDTO): Promise<PageResponseVO<AddressActivityVO>> {
  const serverResponse = await POST(`${Safescan_Api}/address/activity`, params);
  if (serverResponse.data && serverResponse.data.records) {
    serverResponse.data.records = serverResponse.data.records.map(
      AddressActivityFormat
    )
  }else{
    throw new Error("Call SafeScan Error1:");
  }
  return serverResponse.data;
}

export async function fetchAddressAnalytic( params : { address : string } ) : Promise< AddressAnalyticVO  > {
  const serverResponse = await POST(`${Safescan_Api}/addresses/analytic/${params.address}`, params);
  return serverResponse.data;
}


