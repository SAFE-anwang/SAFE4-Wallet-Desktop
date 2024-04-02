import { createReducer } from "@reduxjs/toolkit"
import { addMulticallListeners, clearMulticallState, fetchingMulticallResults, removeMulticallListeners, updateMulticallResults } from "./actions"

export interface MulticallState {
  callListeners?: {
    [callKey: string]: {
      [blocksPerFetch: number]: number
    }
  },
  callResults: {
    [callKey: string]: {
      data?: string | null,
      blockNumber?: number
      fetchingBlockNumber?: number
    } | undefined
  }
}

export interface Call {
  address: string
  callData: string
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const LOWER_HEX_REGEX = /^0x[a-f0-9]*$/
export function toCallKey(call: Call): string {
  if (!ADDRESS_REGEX.test(call.address)) {
    throw new Error(`Invalid address: ${call.address}`)
  }
  if (!LOWER_HEX_REGEX.test(call.callData)) {
    throw new Error(`Invalid hex: ${call.callData}`)
  }
  return `${call.address}-${call.callData}`
}
export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-')
  if (pcs.length !== 2) {
    throw new Error(`Invalid call key: ${callKey}`)
  }
  return {
    address: pcs[0],
    callData: pcs[1]
  }
}

const initialState: MulticallState = {
  callResults: {

  }
}

export default createReducer(initialState, (builder) => {
  builder

    .addCase(addMulticallListeners, (state, { payload: { calls, options: { blocksPerFetch = 1 } = {} } }) => {
      const listeners: MulticallState['callListeners'] = state.callListeners
        ? state.callListeners
        : (state.callListeners = {})
      calls.forEach(call => {
        const callKey = toCallKey(call)
        listeners[callKey] = listeners[callKey] ?? {}
        listeners[callKey][blocksPerFetch] = (listeners[callKey][blocksPerFetch] ?? 0) + 1
      })
    })

    .addCase(
      removeMulticallListeners,
      (state, { payload: { calls, options: { blocksPerFetch = 1 } = {} } }) => {
        const listeners: MulticallState['callListeners'] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {})
        if (!listeners) return
        calls.forEach(call => {
          const callKey = toCallKey(call)
          if (!listeners[callKey]) return
          if (!listeners[callKey][blocksPerFetch]) return

          if (listeners[callKey][blocksPerFetch] === 1) {
            delete listeners[callKey][blocksPerFetch]
          } else {
            listeners[callKey][blocksPerFetch]--
          }
        })
      }
    )

    .addCase(fetchingMulticallResults, (state, { payload: { fetchingBlockNumber, calls } }) => {
      state.callResults = state.callResults ?? {}
      calls.forEach(call => {
        const callKey = toCallKey(call)
        let current = (state && state.callResults) ? state.callResults[callKey] : undefined;
        if (!current) {
          if (!state?.callResults) {
            return;
          }
          current = {
            fetchingBlockNumber
          }
        } else {
          if ((current.fetchingBlockNumber ?? 0) >= fetchingBlockNumber) return
          current.fetchingBlockNumber = fetchingBlockNumber
        }
      })
    })

    .addCase(updateMulticallResults, (state, { payload: { results, blockNumber } }) => {
      state.callResults = state.callResults ?? {}
      Object.keys(results).forEach(callKey => {
        const current = state.callResults[callKey];
        if ((current?.blockNumber ?? 0) > blockNumber) return
        state.callResults[callKey] = {
          data: results[callKey],
          blockNumber
        }
      })
    })

    .addCase(clearMulticallState , ( state , payload ) => {
      return {
        callResults : {}
      }
    })

})
