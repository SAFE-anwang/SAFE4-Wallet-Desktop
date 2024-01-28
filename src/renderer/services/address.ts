import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO } from ".";
import config from "../config";

const { Safescan_URL } = config;
export async function fetchAddressActivity( params : { address:string , blockNumberStart : number , blockNumberEnd : number } | PageQueryDTO ) : Promise<PageResponseVO<AddressActivityVO>> {
  const serverResponse = await POST( `${Safescan_URL}:5005/address/activity` , params );
  serverResponse.data.records = serverResponse.data.records.map(
    AddressActivityFormat
  )
  return serverResponse.data;
}


