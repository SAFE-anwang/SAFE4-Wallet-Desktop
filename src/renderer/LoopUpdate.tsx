
import { useEffect } from "react";
import { useWeb3Network } from "./connectors/hooks";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";
import { useWalletsActiveAccount } from "./state/wallets/hooks";

export default () => {

  const network = useWeb3Network();
  const activeAccount = useWalletsActiveAccount();

  useEffect(() => {
    void network.activate().catch(() => {
      console.debug('Failed to connect to network')
    })
  }, []);

  useEffect( () => {
    console.log("active account....")
  } , [activeAccount] );

  return (<>
    <ApplicationUpdater />
    <MulticallUpdater />
    <TransactionUpdater />
  </>)
}

