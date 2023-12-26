import { configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer';

import application from './application/reducer';
import wallets from './wallets/reducer';

enableMapSet();

const store = configureStore({
    reducer: {
        application,
        wallets
    }
})

export default store
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
