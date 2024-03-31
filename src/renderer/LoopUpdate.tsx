
import { useEffect } from "react";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";
import { useWeb3React } from "@web3-react/core";

export default () => {
  const { connector } = useWeb3React();
  useEffect(() => {
     connector.activate();
  }, []);

  return (<>
    <ApplicationUpdater />
    <MulticallUpdater />
    <TransactionUpdater />
  </>)

}

