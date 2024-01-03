
import { useEffect } from "react";
import { useWeb3Network } from "./connectors/hooks";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";

export default () => {

  const network = useWeb3Network();

  useEffect(() => {
    void network.activate().catch(() => {
      console.debug('Failed to connect to network')
    })
  }, []);

  return (<>
    <ApplicationUpdater />
    <MulticallUpdater />
    <TransactionUpdater />
  </>)
}

