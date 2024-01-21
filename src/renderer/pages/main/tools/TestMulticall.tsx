
import { useEffect, useState } from "react";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3Hooks } from "../../../connectors/hooks";
import { DateTimeFormat } from "../../../utils/DateUtils";
import { useBlockNumber } from "../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract, useSupernodeStorageContract, useSupernodeVoteContract } from "../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../structs/AccountManager";
import { SystemContract } from "../../../constants/SystemContracts";
import DecodeSupportFunction from "../../../constants/DecodeSupportFunction";

export default () => {

  const supernodeVoteContract = useSupernodeVoteContract(true);

  useEffect( () => {
    if ( supernodeVoteContract ){
      // function voteOrApproval(bool _isVote, address _dstAddr, uint[] memory _recordIDs) external;
      // supernodeVoteContract.voteOrApproval(
      //   true , 
      //   "0x131191CfB9aFb4C3F776d6CeCEe1921e8c3EAb0F",
      //   [40]
      // ).then( (response:any) => {
      //   console.log("vote success >>" , response)
      // }).catch( (err : any) => {
      //   console.log("Error :" , err)
      // });
    }
  } , [ supernodeVoteContract ] )

  return <>
    {
      
    }
  </>
}
