import { AddressActivityFormat, AddressActivityVO, GET, PageQueryDTO, PageResponseVO, Safe3AddressVO } from ".";

export async function fetchSafe3Address( API : string , address : string ) : Promise<Safe3AddressVO> {
  const serverResponse = await GET( `${API}/safe3/${address}`);
  return serverResponse.data;
  // return {
  //   address ,
  //   avaliable : "1",
  //   locked : "1050",
  //   masternode : true ,
  //   mLockedAmount : "1000"
  // }
}
