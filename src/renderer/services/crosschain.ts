import { CrossChainVO, GET, POST } from ".";
import { Safe4NetworkChainId } from "../config";

export async function fetchCrossChainByTxHash(API_CROSSCHAIN: string, params: { srcTxHash?: string, dstTxHash?: string }): Promise<CrossChainVO> {
  const serverResponse = await GET(`${API_CROSSCHAIN}/getByTxHash`, params);
  return serverResponse;
}

export async function fetchCrossChainByAddress(API_CROSSCHAIN: string, params: { address: string }): Promise<CrossChainVO[]> {
  const serverResponse = await GET(`${API_CROSSCHAIN}/getByAddress`, params);
  return serverResponse;
}


export async function fetchCrosschainConfig(chainId: number): Promise<{
  safe_usdt: string,
  minamount: string,
  eth: {
    safe2eth: boolean
  },
  bsc: {
    safe2bsc: boolean
  },
  matic: {
    safe2matic: boolean
  },
  sol?: {
    safe2sol: boolean
  },
  trx?: {
    safe2trx: boolean
  }
}> {
  if (chainId == Safe4NetworkChainId.Testnet) {
    const serverResponse = await GET("https://safewallet.anwang.com/v1/gate/testnet4");
    return serverResponse;
  } else {
    const serverResponse = await GET("https://safewallet.anwang.com/v1/gate/mainnet4");
    return serverResponse;
  }
}
