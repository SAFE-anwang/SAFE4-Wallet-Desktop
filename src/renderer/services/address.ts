import { AddressActivityFormat, AddressActivityVO, AddressAnalyticVO, ApiResponse, POST, PageQueryDTO, PageResponseVO } from ".";

export async function fetchAddressActivity(
  API : string ,
  params: { address: string, blockNumberStart: number, blockNumberEnd: number } | PageQueryDTO
): Promise<PageResponseVO<AddressActivityVO>> {
  const serverResponse = await POST(`${API}/address/activity`, params);
  if (serverResponse.data && serverResponse.data.records) {
    serverResponse.data.records = serverResponse.data.records.map(
      AddressActivityFormat
    )
  } else {
    throw new Error("Call SafeScan Error1:");
  }
  return serverResponse.data;
}

export async function fetchAddressAnalytic( API : string , params: { address: string }): Promise<AddressAnalyticVO> {
  const serverResponse = await POST(`${API}/addresses/analytic/${params.address}`, params);
  return serverResponse.data;
}


