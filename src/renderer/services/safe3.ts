import { AddressActivityFormat, AddressActivityVO, GET, PageQueryDTO, PageResponseVO, Safe3AddressVO } from ".";
import config from "../config";

const { Safescan_URL } = config;

export async function fetchSafe3Address( address : string ) : Promise<Safe3AddressVO> {
  // const serverResponse = await GET( `${Safescan_URL}:5005/safe3/${address}`);
  // return serverResponse.data;
  return {
    address ,
    avaliable : "1",
    locked : "1",
    masternode : true
  }
}
