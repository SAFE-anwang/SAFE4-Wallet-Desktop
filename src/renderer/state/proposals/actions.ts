import { createAction } from "@reduxjs/toolkit";
import { ProposalInfo } from "../../structs/Proposal";

export const loadProposalReadedIds =  createAction<{ chainId: number, proposalIds: number[] }[] >("proposals/loadProposalReadedIds");

export const addProposals = createAction<{ chainId: number, proposals: ProposalInfo[] }>("proposals/add");

export const updateProposalReaded = createAction<{ chainId: number, proposalId : number }>("proposals/updateProposalReaded");


