import { configureStore } from '@reduxjs/toolkit'

import application from './application/reducer';
import wallets from './wallets/reducer';
import multicall from './multicall/reducer';
import transactions from './transactions/reducer';
import audit from './audit/reducer';
import proposals from './proposals/reducer';
import dApp from './dApp/reducer';


const store = configureStore({
  reducer: {
    application,
    wallets,
    multicall,
    transactions,
    audit,
    proposals,
    dApp
  }
})

export default store
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
