
import { useEffect } from "react";
import { useWeb3Network } from "./connectors/hooks";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";
import { useWalletsActiveAccount } from "./state/wallets/hooks";
import { IPC_CHANNEL } from "./config";
import { DBSignal } from "../main/handlers/DBSignalHandler";

export default () => {

  const network = useWeb3Network();
  const activeAccount = useWalletsActiveAccount();

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

