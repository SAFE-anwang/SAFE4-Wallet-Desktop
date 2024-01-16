
import { useEffect, useState } from "react";
import { useETHBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3Hooks } from "../../../connectors/hooks";
import { DateTimeFormat } from "../../../utils/DateUtils";
import { useBlockNumber } from "../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract } from "../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../structs/AccountManager";

export default () => {

  const blockNumber = useBlockNumber();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);

  useEffect(() => {
    if (blockNumber && accountManagerContract) {
      accountManagerContract.callStatic
        .getRecords("0x3525058AdABF4bc77D10D583A522205e8c624b53")
        .then(accountRecords => setAccountRecords(accountRecords.map(formatAccountRecord)))
    }
  }, [blockNumber, accountManagerContract]);

  useEffect(() => {
    const fragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
    if (accountRecords.length > 0 && fragment && multicallContract) {
      const calls = accountRecords.map(accountRecord => {
        return {
          address: accountManagerContract?.address,
          callData: accountManagerContract?.interface.encodeFunctionData(fragment, [accountRecord.id])
        }
      });
      multicallContract.callStatic.aggregate(calls.map(call => [call.address,call.callData])).then( (data) => {
        // blockNumber
        console.log(data[0].toNumber())
        data[1].map( (result : any) => {
          const recordUserInfo = accountManagerContract?.interface.decodeFunctionResult(fragment ,result)[0];
          if (recordUserInfo){
            console.log( formatRecordUseInfo(recordUserInfo) )
          }
        })
      })
      
    }
  }, [accountRecords]);

  return <>

  </>
}
