import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO, SuperNodeVO } from ".";
import config from "../config";
import { SupernodeInfo } from "../structs/Supernode";

const { Safescan_URL } = config;

export async function fetchSuperNodes( params : PageQueryDTO ) : Promise<PageResponseVO<SuperNodeVO>> {
  const serverResponse = await POST( `${Safescan_URL}:5005/nodes/supermasternodes` , { ...params } );
  return serverResponse.data;
}

export async function fetchSuperNodeAddresses() : Promise<string[]> {
  const serverResponse = await POST( `${Safescan_URL}:5005/nodes/supernodeAddresses` , {} );
  return serverResponse.data;
}





