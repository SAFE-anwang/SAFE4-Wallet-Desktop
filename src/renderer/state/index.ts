import { configureStore } from '@reduxjs/toolkit'

import application from './application/reducer';
import wallets from './wallets/reducer';
import multicall from './multicall/reducer';
import transactions from './transactions/reducer';


const store = configureStore({
    reducer: {
        application,
        wallets,
        multicall,
        transactions
    }
})

export default store
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
