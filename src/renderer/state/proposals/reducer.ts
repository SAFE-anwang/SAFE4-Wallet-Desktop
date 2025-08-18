import { createReducer } from "@reduxjs/toolkit";
import { addProposals, loadProposalReadedIds, updateProposalReaded, updateUnreadIds } from "./actions";
import { IPC_CHANNEL } from "../../config";
import { ProposalReadedSignal, ProposalReadedSignal_Methods, ProposalReadedSignalHandler } from "../../../main/handlers/ProposalReadedSignalHandler";

export interface ProposalsState {
  [chainId: number]: {
    readedIds: number[],
    unreadIds: number[],
    proposals: {
      [id: number]: {
        id: number,
        title: string,
        state: number,
        startPayTime: number
      }
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
          unreadIds: [],
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
          unreadIds: [],
          proposals: {}
        };
      }
      const proposalsMap = proposals.reduce((map, proposalInfo) => {
        const { id, state, title, startPayTime } = proposalInfo;
        map[id] = {
          id, state, title, startPayTime
        };
        return map;
      }, {} as {
        [id: number]: {
          id: number, state: number, title: string, startPayTime: number
        }
      });
      state[chainId].proposals = proposalsMap;
    })

    .addCase(updateProposalReaded, (state, { payload }) => {
      const { chainId, proposalId } = payload;
      // 初始化
      if (!state[chainId]) {
        state[chainId] = {
          readedIds: [],
          proposals: {},
          unreadIds: []
        };
      }
      if (state[chainId].readedIds.indexOf(proposalId) == -1) {
        state[chainId].readedIds.push(proposalId);
        window.electron.ipcRenderer.sendMessage(
          IPC_CHANNEL, [ProposalReadedSignal, ProposalReadedSignal_Methods.saveOrUpdate, [chainId, [...state[chainId].readedIds]]]
        )
      }
    })

    .addCase(updateUnreadIds, (state, { payload }) => {
      const { chainId, proposalIds } = payload;
      state[chainId].unreadIds = proposalIds;
    })

})

