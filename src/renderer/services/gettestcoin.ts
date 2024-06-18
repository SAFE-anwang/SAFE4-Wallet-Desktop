import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO, GetTestCoinVO } from ".";


export async function fetchGetTestCoin( API : string , params : { address:string } ) : Promise<PageResponseVO<GetTestCoinVO>> {
  const serverResponse = await POST( `${API}/get_test_coin` , params );
  if ( serverResponse.code != "0" ){
    throw new Error( serverResponse.message );
  }
  return serverResponse.data;
}
