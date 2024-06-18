import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO, SuperNodeVO } from ".";


export async function fetchSuperNodes( API : string , params : PageQueryDTO ) : Promise<PageResponseVO<SuperNodeVO>> {
  const serverResponse = await POST( `${API}/nodes/supermasternodes` , { ...params } );
  return serverResponse.data;
}

export async function fetchSuperNodeAddresses( API : string ) : Promise<string[]> {
  const serverResponse = await POST( `${API}/nodes/supernodeAddresses` , {} );
  return serverResponse.data;
}





