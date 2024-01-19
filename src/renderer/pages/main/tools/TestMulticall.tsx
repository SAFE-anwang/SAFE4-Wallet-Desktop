
import { useEffect, useState } from "react";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3Hooks } from "../../../connectors/hooks";
import { DateTimeFormat } from "../../../utils/DateUtils";
import { useBlockNumber } from "../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract } from "../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../structs/AccountManager";
import { SystemContract } from "../../../constants/SystemContracts";
import DecodeSupportFunction from "../../../constants/DecodeSupportFunction";

export default () => {

  const arr = [];

  arr[0] = 0;
  arr[2] = 2;

  return <>
    {
      <>{JSON.stringify(arr)}</>
    }
  </>
}
