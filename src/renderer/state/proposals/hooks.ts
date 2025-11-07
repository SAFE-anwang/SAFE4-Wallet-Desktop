import { useWeb3React } from "@web3-react/core";
import { useSelector } from "react-redux";
import { AppState } from "..";



export function useReadedProposalIds() {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!chainId || !state.proposals[chainId]) return undefined;
    return state.proposals[chainId].readedIds;
  });
}

export function useStateProposals() {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!chainId || !state.proposals[chainId]) return undefined;
    return state.proposals[chainId].proposals;
  });
}

export function useUnreadProposalIds() {
  const { chainId } = useWeb3React();
  return useSelector((state: AppState) => {
    if (!chainId || !state.proposals[chainId]) return undefined;
    return state.proposals[chainId].unreadIds;
  });
}
