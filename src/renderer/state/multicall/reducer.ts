import { createReducer } from "@reduxjs/toolkit"

export interface MulticallState {

  callListeners ?: {
    [ callKey : string ] : {
      [ blocksPerFetch: number ] : number
    }
  },

  callResults ?: {
    [ callKey : string ] : {
      data ?: string | null,
      blockNumber ?: number
      fetchingBlockNumber ?: number
    }
  }

}

const initialState : MulticallState = {
  callResults : {

  }
}

export default createReducer(initialState, (builder) => {

})
