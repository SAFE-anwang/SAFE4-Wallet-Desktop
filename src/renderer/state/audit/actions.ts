import { createAction } from "@reduxjs/toolkit";

export const updateAuditTokens = createAction<{
  chainId: number, tokens: {
    name: string,
    symbol: string,
    address: string,
    decimals: number,
    chainId: number,
    creator?: string,
    logoURI?: string
  }[]
}>("transactions/updateAuditTokens");

export const updateTokenPrices = createAction<{
  chainId: number, tokens: {
    name: string,
    symbol: string,
    address: string,
    decimals: number,
    usdtReserves: string,
    change: string,
    logoURI: string,
    price: string
  }[]
}>("audit/updateTokenPrices");
