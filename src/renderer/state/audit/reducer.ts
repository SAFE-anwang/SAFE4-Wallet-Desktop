import { createReducer } from "@reduxjs/toolkit"
import { updateAuditTokens } from "./actions"
import { Safe4NetworkChainId, USDT, WSAFE } from "../../config"

export interface IAuditState {
  tokens: {
    [chainId: number]: {
      address: string,
      name?: string,
      symbol?: string,
      decimals : number,
      chainId: number ,
      creator ?: string
    }[]
  }
}

const initialState: IAuditState = {
  tokens: {
    [Safe4NetworkChainId.Testnet]: [
      { ...WSAFE[Safe4NetworkChainId.Testnet] },
      // { ...USDT[Safe4NetworkChainId.Testnet] }
    ],
    [Safe4NetworkChainId.Mainnet]: [
      { ...WSAFE[Safe4NetworkChainId.Mainnet] },
      // { ...USDT[Safe4NetworkChainId.Mainnet] }
    ]
  }
}

export default createReducer(initialState, (builder) => {
  builder.addCase(updateAuditTokens, (state, { payload }) => {
    const { chainId, tokens } = payload;
    state.tokens[chainId] = tokens;
  })
})
