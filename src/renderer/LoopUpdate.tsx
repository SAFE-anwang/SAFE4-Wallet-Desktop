
import { useEffect } from "react";
import ApplicationUpdater from "./state/application/updater";
import MulticallUpdater from "./state/multicall/updater";
import TransactionUpdater from "./state/transactions/updater";
import { useWeb3React } from "@web3-react/core";
import { useDispatch } from "react-redux";
import { clearMulticallState } from "./state/multicall/actions";
import CrosschainUpdater from "./state/transactions/CrosschainUpdater";
import AuditUpdater from "./state/audit/AuditUpdater";
import ProposalUpdater from "./state/proposals/ProposalUpdater";

export default () => {
  const dispatch = useDispatch();
  const { connector } = useWeb3React();
  useEffect(() => {
    connector.activate();
    // 在切换网络后 , 清除multicall的当前存储数据.
    dispatch(clearMulticallState())
  }, []);
  return (<>
    <ApplicationUpdater />
    <MulticallUpdater />
    <TransactionUpdater />
    <CrosschainUpdater />
    <AuditUpdater />
    <ProposalUpdater />
  </>)

}

