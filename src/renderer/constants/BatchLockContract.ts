import { Safe4NetworkChainId } from "../config"


export enum BatchLockLevel {
  TEN_CENTS = 0.1,
  ONE_CENT = 0.01
}

export const BatchLockContract: {
  [chainId: number]: {
    [LEVEL: number]: string
  }
} = {
  [Safe4NetworkChainId.Mainnet]: {
    [BatchLockLevel.TEN_CENTS]: "0xA7DBB85CB123106B0d227a317D00A53574694aC6",
    [BatchLockLevel.ONE_CENT]: "0xF6A2C019beF11825E73ed219c7b0582324dE91b2",
  },
  [Safe4NetworkChainId.Testnet]: {
    [BatchLockLevel.TEN_CENTS]: "0xF6A2C019beF11825E73ed219c7b0582324dE91b2",
    [BatchLockLevel.ONE_CENT]: "0xA7DBB85CB123106B0d227a317D00A53574694aC6",
  }

}
