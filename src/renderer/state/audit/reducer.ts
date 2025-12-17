import { createReducer } from "@reduxjs/toolkit"
import { updateAuditTokens, updateTokenPrices } from "./actions"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"
import { ethers } from "ethers"

export interface IAuditState {
  tokens: {
    [chainId: number]: {
      address: string,
      name?: string,
      symbol?: string,
      decimals: number,
      chainId: number,
      creator?: string,
      logoURI?: string,
    }[]
  },
  prices: {
    [chainId: number]: {
      address: string,
      name : string,
      symbol : string,
      decimals: number,
      logoURI: string,
      usdtReserves: string,
      change: string,
      price: string
    }[]
  }
}

const initialState: IAuditState = {
  tokens: {
    [Safe4NetworkChainId.Testnet]: [
      { ...WSAFE[Safe4NetworkChainId.Testnet] },
      { ...USDT[Safe4NetworkChainId.Testnet] }
    ],
    [Safe4NetworkChainId.Mainnet]: [
      { ...WSAFE[Safe4NetworkChainId.Mainnet] },
      { ...USDT[Safe4NetworkChainId.Mainnet] }
    ]
  },
  prices: {
    [Safe4NetworkChainId.Testnet]: [],
    [Safe4NetworkChainId.Mainnet]: []
  }
}

export default createReducer(initialState, (builder) => {
  builder.addCase(updateAuditTokens, (state, { payload }) => {
    const { chainId, tokens } = payload;
    tokens.forEach(token => token.address = ethers.utils.getAddress(token.address));
    state.tokens[chainId] = tokens;
  })
    .addCase(updateTokenPrices, (state, { payload }) => {
      const { chainId, tokens } = payload;
      tokens.forEach(token => token.address = ethers.utils.getAddress(token.address));
      state.prices[chainId] = tokens;
    })
})
