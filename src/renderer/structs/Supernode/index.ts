import { CurrencyAmount, JSBI } from "@uniswap/sdk";

/**
 *     struct StateInfo {
        uint state;
        uint height;
    }
 */
export interface StateInfo {
    state: number,
    height: number,
}
export function formatStateInfo(stateInfo: any): StateInfo {
    const { state, height } = stateInfo;
    return {
        state: state.toNumber(),
        height: height.toNumber()
    }
}

/**
    struct MemberInfo {
        uint lockID; // lock id
        address addr; // member address
        uint amount; // lock amount
        uint height; // add height
    }
 */
export interface MemberInfo {
    lockID: number,
    addr: string,
    amount: CurrencyAmount,
    height: number
}
export function formatMemberInfo(memberInfo: any): MemberInfo {
    const { lockID, addr, amount, height } = memberInfo;
    return {
        lockID: lockID.toNumber(),
        addr,
        amount: CurrencyAmount.ether(JSBI.BigInt(amount.toString())),
        height: height.toNumber()
    }
}

/**
 *     struct IncentivePlan {
        uint creator; // creator percent [0, 10%]
        uint partner; // partner percent [40%, 50$]
        uint voter; // voter percent [40%, 50%]
    }
 */
export interface IncentivePlan {
    creator: number,
    partner: number,
    voter: number
}
export function formatIncentivePlan(incentivePlan: any): IncentivePlan {
    const { creator, partner, voter } = incentivePlan;
    return {
        creator: creator.toNumber(),
        partner: partner.toNumber(),
        voter: voter.toNumber()
    }
}

/**
 *
    struct VoteInfo {
        MemberInfo[] voters; // all voters
        uint totalAmount; // total voter's amount
        uint totalNum; // total vote number
        uint height; // last vote height
    }
 */
export interface VoteInfo {
    totalNum : number,
    height : number,
    totalAmount : CurrencyAmount,
    voters : MemberInfo[]
}
export function formatVoteInfo( voteInfo : any ) : VoteInfo {
    const { voters , totalAmount , totalNum , height } = voteInfo;
    return {
        voters : voters.map(formatMemberInfo),
        totalAmount : CurrencyAmount.ether(JSBI.BigInt(totalAmount.toString())),
        totalNum : 0,
        height : height.toNumber(),
    }
}

/**
    struct SuperNodeInfo {
        uint id; // supernode id
        string name; // supernode name
        address addr; // supernode address
        address creator; // creator address
        string enode; // supernode enode, contain node id & node ip & node port
        string description; // supernode description
        bool isOfficial; // official or not
        StateInfo stateInfo; // masternode state information
        MemberInfo[] founders; // supernode founders
        IncentivePlan incentivePlan; // incentive plan
        VoteInfo voteInfo; // vote information
        uint lastRewardHeight; // last reward height
        uint createHeight; // supernode create height
        uint updateHeight; // supernode update height
    }
 */
export interface SupernodeInfo {
    id: number,
    name: string,
    addr: string,
    creator: string,
    enode: string,
    description: string,
    isOfficial: boolean,
    state : number,
    founders : MemberInfo[],
    incentivePlan : IncentivePlan,
    voteInfo ?: VoteInfo,
    lastRewardHeight: number,
    createHeight: number,
    updateHeight: number,

    totalVoteNum ?: CurrencyAmount,
    totalAmount  ?: CurrencyAmount,
    unlockHeight ?: number

}

export function formatSupernodeInfo(supernodeInfo: any) : SupernodeInfo {
    const {
        id, addr, creator, enode, isOfficial, lastRewardHeight, createHeight, updateHeight,
        state, founders, incentivePlan ,
    } = supernodeInfo;
    let name = "";
    let description = "";
    try {
      name = supernodeInfo.name;
    }catch(err){

    }
    try {
      description = supernodeInfo.description;
    }catch(err){

    }
    return {
        id: id.toNumber(),
        name,
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
        incentivePlan: formatIncentivePlan(incentivePlan),
    };
}
