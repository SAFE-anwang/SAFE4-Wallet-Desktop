
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
  const input = "0x47e7ef24000000000000000000000000ff3ebfd9876bcabb0dc98477d6b7c064eb0815570000000000000000000000000000000000000000000000000000000000000001";
  const result = DecodeSupportFunction(
    "0x0000000000000000000000000000000000001090",
    input
  );
  console.log( "result >>" , result )
  return <>

  </>
}
