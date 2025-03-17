import { CrossChainVO, GET, POST } from ".";

export async function fetchCrossChainByTxHash( API_CROSSCHAIN : string , params: { srcTxHash ?: string , dstTxHash ?: string }): Promise<CrossChainVO> {
  const serverResponse = await GET(`${API_CROSSCHAIN}/getByTxHash`, params);
  return serverResponse;
}

export async function fetchCrossChainByAddress( API_CROSSCHAIN : string , params : { address : string } ) : Promise<CrossChainVO[]>{
  const serverResponse = await GET(`${API_CROSSCHAIN}/getByAddress`, params);
  return serverResponse;
}
