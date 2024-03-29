
import { useEffect } from "react";
import { useWeb3Network } from "./connectors/hooks";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";
import { useWeb3React } from "@web3-react/core";

export default () => {
  // const network = useWeb3Network();
  const { connector } = useWeb3React();
  useEffect(() => {
     connector.activate();
    //  network.activate()
  }, []);

  return (<>
    <ApplicationUpdater />
    <MulticallUpdater />
    <TransactionUpdater />
  </>)

}

