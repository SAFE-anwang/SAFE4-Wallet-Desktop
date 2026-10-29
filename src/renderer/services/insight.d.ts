export interface NftTokenVO {
  address: string,
  burnable: boolean,
  creator: string,
  holders: number | undefined,
  logoURI: string | undefined,
  name: string,
  symbol: string,
  template: boolean | undefined,
  totalAssets: number | undefined,
  totalTransfers: number | undefined,
  type: string,
  version: string
}

export interface NftAssetsCountVO {
  owner: string,
  token: string,
  count: number
}

export interface NftAssetVO {
  owner : string ,
  token : string ,
  tokenType : string,
  tokenImage : string,
  tokenId : number,
  tokenURI : string,
  tokenValue : number
}
