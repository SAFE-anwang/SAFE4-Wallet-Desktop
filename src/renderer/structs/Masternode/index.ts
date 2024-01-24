import { IncentivePlan, MemberInfo, StateInfo, formatIncentivePlan, formatMemberInfo, formatStateInfo } from "../Supernode";

/**
 *     struct MasterNodeInfo {
        uint id; // masternode id
        address addr; // masternode address
        address creator; // createor address
        string enode; // masternode enode, contain node id & node ip & node port
        string description; // masternode description
        bool isOfficial; // official or not
        StateInfo stateInfo; // masternode state information
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
  stateInfo: StateInfo,
  founders: MemberInfo[],
  incentivePlan: IncentivePlan,
  lastRewardHeight: number,
  createHeight: number,
  updateHeight: number
}
export function formatMasternode( masternode : any) : MasternodeInfo {
  const {
    id, name, addr, creator, enode, description, isOfficial, lastRewardHeight, createHeight, updateHeight,
    stateInfo, founders, incentivePlan
  } = masternode;
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
    stateInfo: formatStateInfo(stateInfo),
    founders: founders.map(formatMemberInfo),
    incentivePlan: formatIncentivePlan(incentivePlan)
  };

}
