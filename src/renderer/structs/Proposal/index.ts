import { CurrencyAmount } from "@uniswap/sdk";

/**
 *  struct VoteInfo {
        address voter;
        uint voteResult;
    }
 */
export interface VoteInfo {
    voter: string,
    voteResult: number
}
export function formatVoteInfo( _voteInfo : any ) : VoteInfo {
    const { voter , voteResult } = _voteInfo;
    return {
        voter , 
        voteResult : voteResult.toNumber()
    }
}

/**
 *  struct ProposalInfo {
        uint id;
        address creator;
        string title;
        uint payAmount;
        uint payTimes;
        uint startPayTime;
        uint endPayTime;
        string description;
        uint state;
        uint createHeight;
        uint updateHeight;
    }
 */
export interface ProposalInfo {
    id: number,
    creator: string,
    title: string,
    payAmount: CurrencyAmount,
    payTimes: number,
    startPayTime: number,
    endPayTime: number,
    description: string,
    state: number,
    createHeight: number,
    updateHeight: number
}


export function formatProposalInfo(_proposalInfo: any): ProposalInfo {
    const { id, creator, title, payAmount, payTimes, startPayTime, endPayTime, description, state, createHeight, updateHeight } = _proposalInfo;
    return {
        id: id.toNumber(),
        creator,
        title,
        payAmount: CurrencyAmount.ether(payAmount),
        payTimes: payTimes.toNumber(),
        startPayTime: startPayTime.toNumber(),
        endPayTime: endPayTime.toNumber(),
        description,
        state: state.toNumber(),
        createHeight: createHeight.toNumber(),
        updateHeight: updateHeight.toNumber()
    }
}