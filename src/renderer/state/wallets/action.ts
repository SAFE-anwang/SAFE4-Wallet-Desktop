import { createAction } from "@reduxjs/toolkit";
import { SupportChildWalletType } from "../../utils/GenerateChildWallet";

export const walletsLoadWallets = createAction<{
  publicKey: string,
  address: string,
  path?: string
}[]>(
  "wallets/loadWallets"
)

export const walletsUpdateActiveWallet = createAction<string>(
  "wallets/updateActiveWallet"
)

export const walletsLoadWalletNames = createAction<{ address: string, name: string, active: boolean }[]>(
  "wallets/loadWalletNames"
)

export const walletsUpdateWalletName = createAction<{ address: string, name: string }>(
  "wallets/updateWalletName"
)

export const walletsUpdateWalletChildWallets = createAction<{
  address: string, type: SupportChildWalletType, loading: boolean, result?: {
    map: {
      [address: string]: {
        path: string,
        exist: boolean
      }
    }
  }
}>(
  "wallets/updateWalletChildWallets"
)

export const walletsUpdateUsedChildWalletAddress = createAction<{ address: string | undefined, used: boolean }>(
  "wallets/updateUsedChildWalletAddress"
)

export const walletsClearWalletChildWallets = createAction(
  "wallets/clearWalletChildWallets"
)

export const walletsUpdateLocked = createAction<boolean>("walletsUpdateLocked");

export const walletsUpdateForceOpen = createAction<boolean>("walletsUpdateForce");

export const walletsForceLock = createAction("walletsForceClose");
