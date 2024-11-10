import { AccountRecord } from "../AccountManager";
import { IncentivePlan, MemberInfo, StateInfo, formatIncentivePlan, formatMemberInfo, formatStateInfo } from "../Supernode";

/**
 *     struct MasterNodeInfo {
        uint id; // masternode id
        address addr; // masternode address
        address creator; // createor address
        string enode; // masternode enode, contain node id & node ip & node port
        string description; // masternode description
        bool isOfficial; // official or not
        uint state; // masternode state information
        MemberInfo[] founders; // masternode founders
        IncentivePlan incentivePlan; // incentive plan
        uint lastRewardHeight; // last reward height
        uint createHeight; // masternode create height
        uint updateHeight; // masternode update height
    }
 */
export interface MasternodeInfo {
  id: number,
  addr: string,
  creator: string,
  enode: string,
  description: string,
  isOfficial: boolean,
  state: number,
  founders: MemberInfo[],
  incentivePlan: IncentivePlan,
  lastRewardHeight: number,
  createHeight: number,
  updateHeight: number,

  accountRecord ?: AccountRecord
}
export function formatMasternode( masternode : any) : MasternodeInfo {
  const {
    id, addr, creator, enode, isOfficial, lastRewardHeight, createHeight, updateHeight,
    state, founders, incentivePlan
  } = masternode;
  let description = "";
  try {
    description = masternode.description;
  }catch( err ){

  }
  return {
    id: id.toNumber(),
    addr,
    creator,
    enode,
    description,
    isOfficial,
    lastRewardHeight: lastRewardHeight.toNumber(),
    createHeight: createHeight.toNumber(),
    updateHeight: updateHeight.toNumber(),
    state: state.toNumber(),
    founders: founders.map(formatMemberInfo),
    incentivePlan: formatIncentivePlan(incentivePlan)
  };

}
