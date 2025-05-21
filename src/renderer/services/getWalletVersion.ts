import { PageResponseVO, POST, WalletVersionVO } from ".";

export async function fetchWalletLatest( API : string , params : { appOS : string } ) : Promise<WalletVersionVO> {
  const serverResponse = await POST( `${API}/wallets/latest` , params );
  if ( serverResponse.code != "0" ){
    throw new Error( JSON.stringify(serverResponse) );
  }
  return serverResponse.data;
}
