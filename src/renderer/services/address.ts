import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO } from ".";

export async function fetchAddressActivity( params : { address:string , blockNumberStart : number , blockNumberEnd : number } | PageQueryDTO ) : Promise<PageResponseVO<AddressActivityVO>> {
  const serverResponse = await POST( `http://47.107.47.210:5005/address/activity` , params );
  console.log("fetch result:" , serverResponse.data.records)
  serverResponse.data.records = serverResponse.data.records.map(
    AddressActivityFormat
  )
  return serverResponse.data;
}


