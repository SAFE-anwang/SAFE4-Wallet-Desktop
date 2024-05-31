import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO, SuperNodeVO } from ".";
import config from "../config";

const { Safescan_Api } = config;

export async function fetchSuperNodes( params : PageQueryDTO ) : Promise<PageResponseVO<SuperNodeVO>> {
  const serverResponse = await POST( `${Safescan_Api}/nodes/supermasternodes` , { ...params } );
  return serverResponse.data;
}

export async function fetchSuperNodeAddresses() : Promise<string[]> {
  const serverResponse = await POST( `${Safescan_Api}/nodes/supernodeAddresses` , {} );
  return serverResponse.data;
}





