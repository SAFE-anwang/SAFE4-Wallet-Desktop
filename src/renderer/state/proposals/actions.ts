import { createAction } from "@reduxjs/toolkit";
import { ProposalInfo } from "../../structs/Proposal";

export const loadProposalReadedIds = createAction<{ chainId: number, proposalIds: number[] }[]>("proposals/loadProposalReadedIds");

export const addProposals = createAction<{ chainId: number, proposals: { id: number, state: number, title: string , startPayTime : number }[] }>("proposals/add");

export const updateProposalReaded = createAction<{ chainId: number, proposalId: number }>("proposals/updateProposalReaded");

export const updateUnreadIds = createAction<{ chainId: number, proposalIds: number[] }>("proposals/updateProposalUnread");


