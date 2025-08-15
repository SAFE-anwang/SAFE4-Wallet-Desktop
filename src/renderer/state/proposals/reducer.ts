import { createReducer } from "@reduxjs/toolkit";
import { ProposalInfo } from "../../structs/Proposal";
import { addProposals, loadProposalReadedIds, updateProposalReaded } from "./actions";
import { IPC_CHANNEL } from "../../config";
import { ProposalReadedSignal, ProposalReadedSignal_Methods, ProposalReadedSignalHandler } from "../../../main/handlers/ProposalReadedSignalHandler";

export interface ProposalsState {
  [chainId: number]: {
    readedIds: number[],
    proposals: {
      [id: number]: ProposalInfo
    }
  }
}

export const initialState: ProposalsState = {

}

export default createReducer(initialState, (builder) => {

  builder.addCase(loadProposalReadedIds, (state, { payload }) => {
    payload.forEach(({ chainId, proposalIds }) => {
      // 初始化
      if (!state[chainId]) {
        state[chainId] = {
          readedIds: proposalIds,
          proposals: {}
        };
      }
    })
  })

    .addCase(addProposals, (state, { payload }) => {
      const { chainId, proposals } = payload;
      // 初始化
      if (!state[chainId]) {
        state[chainId] = {
          readedIds: [],
          proposals: {}
        };
      }
    })
    .addCase(updateProposalReaded, (state, { payload }) => {
      const { chainId, proposalId } = payload;
      // 初始化
      if (!state[chainId]) {
        state[chainId] = {
          readedIds: [],
          proposals: {}
        };
      }
      if (state[chainId].readedIds.indexOf(proposalId) == -1) {
        state[chainId].readedIds.push(proposalId);
        window.electron.ipcRenderer.sendMessage(
          IPC_CHANNEL, [ProposalReadedSignal, ProposalReadedSignal_Methods.saveOrUpdate, [chainId, [...state[chainId].readedIds]]]
        )
      }

    })

})

