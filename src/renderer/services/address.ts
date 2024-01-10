import { AddressActivityVO, POST, PageQueryDTO, PageResponseVO } from ".";

export async function fetchAddressActivity( params : { address:string , blockNumberStart : number , blockNumberEnd : number } | PageQueryDTO ) : Promise<PageResponseVO<AddressActivityVO>> {
  const serverResponse = await POST( `http://127.0.0.1:5005/address/activity` , params );
  return serverResponse.data;
}


