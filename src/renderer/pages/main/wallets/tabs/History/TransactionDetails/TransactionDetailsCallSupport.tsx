import { Card, Typography } from "antd"
import { TransactionDetails } from "../../../../../../state/transactions/reducer"
import { SystemContract } from "../../../../../../constants/SystemContracts";
import { useCallback } from "react";
import { Application_Crosschain, Application_Crosschain_Pool_BSC, Safe4NetworkChainId } from "../../../../../../config";
import CrosschainPoolDetails from "./CrosschainPoolDetails";
import CrosschainDetails from "./CrosschainDetails";
import { isCrosschainPoolTransaction } from "../../../../../../constants/DecodeSupportFunction";


export default ({
  support,
  transaction
}: {
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
  transaction: TransactionDetails
}) => {

  const SelectCallRender = useCallback(() => {
    const to = transaction.call?.to ?? transaction.data.contract;
    const from = transaction.call?.from;
    switch (to) {
      case SystemContract.AccountManager:
        return <></>
      case Application_Crosschain[Safe4NetworkChainId.Testnet]:
      case Application_Crosschain[Safe4NetworkChainId.Mainnet]:
      case Application_Crosschain[Safe4NetworkChainId.Testnet].toLowerCase():
      case Application_Crosschain[Safe4NetworkChainId.Mainnet].toLowerCase():
        return <CrosschainDetails support={support} transaction={transaction} />;
      default:
        if (isCrosschainPoolTransaction(to, from)) {
          return <CrosschainPoolDetails support={support} transaction={transaction} />;
        }
    }
    return <></>
  }, [transaction, support]);

  return <>
    {SelectCallRender()}
  </>

}
