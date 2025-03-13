import { Card, Typography } from "antd"
import { TransactionDetails } from "../../../../../../state/transactions/reducer"
import { SystemContract } from "../../../../../../constants/SystemContracts";
import { useCallback } from "react";
import { Application_Crosschain_Pool, Safe4NetworkChainId } from "../../../../../../config";
import CrosschainPoolDetails from "./CrosschainPoolDetails";


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
    const to = transaction.call?.to;
    const from = transaction.call?.from;
    switch (to) {
      case SystemContract.AccountManager:
        return <></>
      case Application_Crosschain_Pool[Safe4NetworkChainId.Testnet] || Application_Crosschain_Pool[Safe4NetworkChainId.Mainnet]:
        return <CrosschainPoolDetails support={support} transaction={transaction} />;
      default:
        if (from == Application_Crosschain_Pool[Safe4NetworkChainId.Testnet]
          || from == Application_Crosschain_Pool[Safe4NetworkChainId.Mainnet]
        ) {
          return <CrosschainPoolDetails support={support} transaction={transaction} />;
        }
    }
    return <></>
  }, [transaction, support]);

  return <>
    {SelectCallRender()}
  </>

}
