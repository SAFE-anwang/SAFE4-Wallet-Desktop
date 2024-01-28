import { AddressActivityFormat, AddressActivityVO, POST, PageQueryDTO, PageResponseVO, GetTestCoinVO } from ".";

export async function fetchGetTestCoin( params : { address:string } ) : Promise<PageResponseVO<GetTestCoinVO>> {
  const serverResponse = await POST( `http://localhost:5005/get_test_coin` , params );
  if ( serverResponse.code != "0" ){
    throw new Error( serverResponse.message );
  }
  return serverResponse.data;
}