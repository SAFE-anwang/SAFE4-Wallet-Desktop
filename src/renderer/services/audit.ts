import { GET, POST } from ".";

export async function fetchAuditTokens(API: string): Promise<any> {
  const serverResponse = await POST(`${API}/audit/list/token`);
  return serverResponse.data;
}

export async function fetchNftTokens(InsightApi: string): Promise<any> {
  const serverResponse = await GET(`${InsightApi}/nft/tokens`);
  return serverResponse.result;
}

export async function fetchNftAssetsCount(InsightApi: string, address: string): Promise<any> {
  const url = `${InsightApi}/nft/assets?address=${address}`;
  const serverResponse = await GET(url);
  console.log(`|查询用户 NFT 资产数量|${url} <=`, serverResponse)
  return serverResponse.result;
}

export async function fetchNftAssets(InsightApi: string, address: string, token: string): Promise<any> {
  const url = `${InsightApi}/nft/assets?address=${address}&tokenAddress=${token}`;
  const serverResponse = await GET(url);
  console.log(`|查询用户 NFT 资产条目|${url} <=`, serverResponse)
  return serverResponse.result;
}
