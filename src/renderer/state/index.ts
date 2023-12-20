import { configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer';

import application from './application/reducer'

enableMapSet();

const PERSISTED_KEYS: string[] = [ "application.blockNumber" ]
const store = configureStore({
    reducer: {
        application,
    }
})

export default store
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
