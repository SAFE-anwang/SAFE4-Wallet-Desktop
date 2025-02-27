

const BSC_NETWORK_PNG = require('./bnb-bnb-logo.png');
const ETH_NETWORK_PNG = require('./ethereum-eth-logo.png');
const MATIC_NETWORK_PNG = require('./polygon-matic-logo.png');
const SOL_NETWORK_PNG = require('./solana-sol-logo.png');
const TRX_NETWORK_PNG = require('./tron-trx-logo.png');

export const BSC_NETWORK_LOGO = BSC_NETWORK_PNG;
export const ETH_NETWORK_LOGO = ETH_NETWORK_PNG;
export const MATIC_NETWORK_LOGO = MATIC_NETWORK_PNG;
export const SOL_NETWORK_LOGO = SOL_NETWORK_PNG;
export const TRX_NETWORK_LOGO = TRX_NETWORK_PNG;


export enum NetworkType {
  BSC = "BNB Smart Chain",
  ETH = "Etherum",
  MATIC = "Ploygon",
  TRX = "TRON",
  SOL = "Solana"
}

export function getNetworkLogo(networkType: NetworkType) {
  switch (networkType) {
    case NetworkType.BSC:
      return BSC_NETWORK_LOGO;
    case NetworkType.ETH:
      return ETH_NETWORK_LOGO;
    case NetworkType.MATIC:
      return MATIC_NETWORK_LOGO;
    case NetworkType.TRX:
      return TRX_NETWORK_LOGO;
    case NetworkType.SOL:
      return SOL_NETWORK_LOGO;
  }
}

