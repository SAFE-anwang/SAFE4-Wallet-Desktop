import { AddressActivityFormat, AddressActivityVO, GET, PageQueryDTO, PageResponseVO, Safe3AddressVO } from ".";
import config from "../config";

const { Safescan_Api } = config;

export async function fetchSafe3Address( address : string ) : Promise<Safe3AddressVO> {
  const serverResponse = await GET( `${Safescan_Api}/safe3/${address}`);
  return serverResponse.data;
  // return {
  //   address ,
  //   avaliable : "1",
  //   locked : "1050",
  //   masternode : true ,
  //   mLockedAmount : "1000"
  // }
}
