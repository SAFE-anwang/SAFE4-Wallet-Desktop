import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers"
import { useMemo } from "react";
import { useWeb3Hooks } from "../connectors/hooks";
import MulticallABI from "../abis/Multicall.json";
import { Contract } from '@ethersproject/contracts'
import { useWalletsActivePrivateKey, useWalletsActiveSigner, useWalletsActiveWallet } from "../state/wallets/hooks";
import { SysContractABI, SystemContract } from "../constants/SystemContracts";


export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();
  const activeWallet = useWalletsActiveWallet();
  const signer = useWalletsActiveSigner()
  return useMemo(() => {
    if (!address || !ABI || !provider || !activeWallet) return null
    try {
      return new Contract(
        address, ABI,
        withSignerIfPossible && signer ? signer : provider
      )
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, provider, withSignerIfPossible, activeWallet])
}

export function useMulticallContract(): Contract | null | undefined {
  return useContract( SystemContract.MultiCall , SysContractABI[SystemContract.MultiCall], false);
}

export function useAccountManagerContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.AccountManager , SysContractABI[SystemContract.AccountManager], withSignerIfPossible);
}

export function useSupernodeStorageContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.SuperNodeStorage , SysContractABI[SystemContract.SuperNodeStorage], withSignerIfPossible);
}

export function useSupernodeVoteContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.SNVote , SysContractABI[SystemContract.SNVote], withSignerIfPossible);
}

export function useSupernodeLogicContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.SuperNodeLogic , SysContractABI[SystemContract.SuperNodeLogic], withSignerIfPossible);
}

export function useMasternodeStorageContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.MasterNodeStorage , SysContractABI[SystemContract.MasterNodeStorage], withSignerIfPossible);
}

export function useMasternodeLogicContract( withSignerIfPossible ?: boolean ) : Contract | null | undefined {
  return useContract( SystemContract.MasterNodeLogic , SysContractABI[SystemContract.MasterNodeLogic], withSignerIfPossible);
}
