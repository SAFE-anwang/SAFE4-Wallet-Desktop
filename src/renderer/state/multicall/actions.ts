import { createAction } from "@reduxjs/toolkit";
import { Call } from "./reducer";

export interface ListenerOptions {
    // how often this data should be fetched, by default 1
    readonly blocksPerFetch?: number
  }

export const addMulticallListeners = createAction<{ calls: Call[]; options?: ListenerOptions }>(
    'addMulticallListeners'
  )
  export const removeMulticallListeners = createAction<{ calls: Call[]; options?: ListenerOptions }>(
    'removeMulticallListeners'
  )

export const fetchingMulticallResults = createAction<{ calls: Call[]; fetchingBlockNumber: number }>(
    'fetchingMulticallResults'
)

export const errorFetchingMulticallResults = createAction<{
    calls: Call[]
    fetchingBlockNumber: number
}>('errorFetchingMulticallResults')

export const updateMulticallResults = createAction<{
    blockNumber: number
    results: {
        [callKey: string]: string | null
    }
}>('updateMulticallResults')