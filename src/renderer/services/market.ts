import {GET, StockKLineVO, TokenPriceVO } from ".";

export async function fetchMarketStockKLines(Safescan_URL: string, params: { token0 : string, token1 : string , interval ?: string}): Promise<StockKLineVO[]> {
  const url = `${Safescan_URL}/list/market/klines?token0=${params.token0}&token1=${params.token1}&interval=${params.interval || "30M"}`;
  const serverResponse = await GET(url);
  return serverResponse;
}

export async function fetchMarketPrices(Safescan_URL: string) : Promise<TokenPriceVO[]>  {
  const url = `${Safescan_URL}/list/market/prices`;
  const serverResponse = await GET(url);
  return serverResponse;
}
