import { createAction } from "@reduxjs/toolkit";

export const updateAuditTokens = createAction<{
  chainId: number, tokens: {
    name: string,
    symbol: string,
    address: string,
    decimals: number,
    chainId: number,
    creator ?: string,
  }[]
}>("transactions/updateAuditTokens");
