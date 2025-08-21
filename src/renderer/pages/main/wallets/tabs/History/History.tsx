import { List, Typography, Modal, Divider, Switch, Row, Col, Button, Tooltip } from "antd";
import TransactionElement from "./TransactionElement";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTransactions } from "../../../../../state/transactions/hooks";
import { useBlockNumber } from "../../../../../state/application/hooks";
import { Activity2Transaction, AddressActivityFetch, TransactionDetails } from "../../../../../state/transactions/reducer";
import { DBAddressActivitySignal, DB_AddressActivity_Actions, DB_AddressActivity_Methods } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
import { IPC_CHANNEL } from "../../../../../config";
import { loadTransactionsAndUpdateAddressActivityFetch, refreshAddressTimeNodeReward, reloadTransactionsAndSetAddressActivityFetch } from "../../../../../state/transactions/actions";
import "./index.css"
import { AppState } from "../../../../../state";
import { ZERO } from "../../../../../utils/CurrentAmountUtils";
import { fetchAddressAnalyticNodeRewards } from "../../../../../services/address";
import { useWeb3React } from "@web3-react/core";
import { AddressAnalyticVO, DateTimeNodeRewardVO } from "../../../../../services";
import { DateTimeFormat, TimestampTheEndOf, TimestampTheStartOf } from "../../../../../utils/DateUtils";
import { TimeNodeRewardSignal, TimeNodeReward_Methods } from "../../../../../../main/handlers/TimeNodeRewardHandler";
import useSafeScan from "../../../../../hooks/useSafeScan";
import { DeleteOutlined } from "@ant-design/icons";
import ClearHistoryConfirmModal from "./ClearHistoryConfirmModal";
import { useTranslation } from "react-i18next";
import TransactionDetailsView from "./TransactionDetails/TransactionDetailsView";

const { Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const transactions = useTransactions(activeAccount);
  const [clickTransaction, setClickTransaction] = useState<TransactionDetails>();
  const [showNodeReward, setShowNodeReward] = useState<boolean>(true);
  const dispatch = useDispatch();
  const latestBlockNumber = useBlockNumber();
  const addressActivityFetch = useSelector<AppState, AddressActivityFetch | undefined>(state => state.transactions.addressActivityFetch);
  const { URL, API } = useSafeScan();
  const [openClearHistoryModal, setOpenClearHistoryModal] = useState<boolean>(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [queryRewardsFlag, setQueryRewardsFlag] = useState(true);
  const [earliesTx, setEarliesTx] = useState<TransactionDetails>();

  useEffect(() => {
    const addressActivtiesLoadActivities = DB_AddressActivity_Methods.loadActivities;
    const timeNodeRewardsGetAll = TimeNodeReward_Methods.getAll;
    if (activeAccount && chainId && latestBlockNumber > 0) {
      if (activeAccount != addressActivityFetch?.address || chainId != addressActivityFetch.chainId) {
        console.log("Do load Tx from DB2....");
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, addressActivtiesLoadActivities, [activeAccount, chainId]]);
      }
      if (!loadingMore && queryRewardsFlag) {
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [TimeNodeRewardSignal, timeNodeRewardsGetAll, [activeAccount, chainId]]);
      }
      return window.electron.ipcRenderer.on(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBAddressActivitySignal && arg[1] == addressActivtiesLoadActivities) {
          const [rows, _txDbId] = arg[2];
          console.log(`Load [${activeAccount}] - [${chainId}] AddressActivities From DB : `, rows, _txDbId);
          let dbStoredRange = {
            start: latestBlockNumber,
            end: 1
          };
          const txns = rows.map((row: any) => {
            const { timestamp, block_number } = row;
            if (timestamp) {
              dbStoredRange.start = Math.min(dbStoredRange.start, block_number);
              dbStoredRange.end = Math.max(dbStoredRange.end, block_number);
            }
            return Activity2Transaction(row);
          });

          if (!_txDbId) {
            console.log(`DBStoredRange=${JSON.stringify(dbStoredRange)} / latestBlockNumber = ${latestBlockNumber} / chainId = ${chainId}`);
            dispatch(reloadTransactionsAndSetAddressActivityFetch({
              txns,
              addressActivityFetch: {
                address: activeAccount,
                blockNumberStart: dbStoredRange.end,
                blockNumberEnd: latestBlockNumber == 0 ? 99999999 : latestBlockNumber,
                current: 1,
                pageSize: 500,
                status: 0,
                dbStoredRange,
                chainId
              }
            }));
          } else {
            dispatch(loadTransactionsAndUpdateAddressActivityFetch({
              chainId,
              addTxns: txns
            }))
          }
          if (txns.length > 0) {
            console.log("||| txns ==>", txns[txns.length - 1]);
            setEarliesTx(txns[txns.length - 1]);
          }
          setLoadingMore(false);
        }
        if (arg instanceof Array && arg[0] == TimeNodeRewardSignal && arg[1] == timeNodeRewardsGetAll) {
          const rows = arg[2][0];
          const dbTimeNodeRewardMap: {
            [date in string]: string
          } = {};
          const dbTimeNodeRewards = rows.map((row: any) => {
            dbTimeNodeRewardMap[row.time_key] = row.amount;
            return {
              address: activeAccount,
              amount: row.amount,
              count: row.count,
              date: row.time_key
            }
          });
          console.log(`Load [${activeAccount}] Node Rewards From DB : `, dbTimeNodeRewards);
          // 将加载的 DB 数据更新到 state1
          dispatch(refreshAddressTimeNodeReward({
            chainId,
            address: activeAccount,
            nodeRewards: dbTimeNodeRewards
          }));
          // 远程访问浏览器接口,获取新的数据
          fetchAddressAnalyticNodeRewards(API, { address: activeAccount.toLocaleLowerCase() })
            .then((data: DateTimeNodeRewardVO[]) => {
              const nodeRewards = data;
              console.log(`Query-API [${activeAccount}] Node Rewards : `, nodeRewards);
              if (nodeRewards) {
                dispatch(refreshAddressTimeNodeReward({
                  chainId,
                  address: activeAccount,
                  nodeRewards
                }));
                // 将访问的数据更新到数据库
                const method = TimeNodeReward_Methods.saveOrUpdate;
                const saveOrUpdateNodeRewards = nodeRewards.filter(nodeReward => {
                  const { date, amount, count } = nodeReward;
                  if (!dbTimeNodeRewardMap[date]) {
                    return true;
                  }
                  if (dbTimeNodeRewardMap[date] && dbTimeNodeRewardMap[date] != amount) {
                    return true;
                  }
                  return false;
                }).map(nodeReward => {
                  const { date, amount, count } = nodeReward;
                  return {
                    address: activeAccount,
                    amount,
                    count,
                    time: date
                  }
                })
                console.log("SaveOrUpdate TimeNodeRewards => ", saveOrUpdateNodeRewards)
                window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [TimeNodeRewardSignal, method, [
                  saveOrUpdateNodeRewards
                  , chainId]]);
              }
            })
        }
      });
    }
  }, [activeAccount, chainId, latestBlockNumber, loadingMore, queryRewardsFlag])

  const walletTab = useSelector<AppState, string | undefined>(state => state.application.control.walletTab);
  useEffect(() => {
    const appContainer = document.getElementById("appContainer");
    if (appContainer) {
      appContainer.scrollTop = 0;
    }
  }, [walletTab]);

  return <>
    <Row style={{ marginBottom: "20px" }}>
      <Col span={12}>
        <Switch checkedChildren={t("active")} unCheckedChildren={t("inactive")} value={showNodeReward} style={{ float: "left" }}
          onChange={setShowNodeReward} />
        <Text style={{ marginLeft: "5px", float: "left" }}>{t("wallet_history_viewrewards")}</Text>
      </Col>
      <Col span={12} style={{ textAlign: "right" }}>
        <Tooltip title={t("wallet_history_clear_tip1")}>
          <Button onClick={() => setOpenClearHistoryModal(true)} type="dashed" icon={<DeleteOutlined />}>{t("wallet_history_clear")}</Button>
        </Tooltip>
      </Col>
    </Row>
    <div style={{ maxHeight: '66vh', overflow: 'auto', paddingRight: "2%" }}
      onScroll={(event) => {
        const target = event.target as HTMLDivElement;
        const { scrollTop, clientHeight, scrollHeight } = target;
        const ratio = scrollTop / (scrollHeight - clientHeight);
        if (ratio >= 0.9 && !loadingMore) {
          setLoadingMore(true);
          window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, DB_AddressActivity_Methods.loadActivities,
            [activeAccount, chainId, earliesTx?.dbId]]
          );
        }
        if (scrollTop == 0) {
          setQueryRewardsFlag(true);
        } else {
          if (queryRewardsFlag) {
            setQueryRewardsFlag(false);
          }
        }
      }}>
      {
        Object.keys(transactions).sort((d1, d2) => TimestampTheStartOf(d2) - TimestampTheStartOf(d1))
          .filter(date => {
            const txns = transactions[date].transactions;
            const rewardAmount = transactions[date].systemRewardAmount;
            let standardTxnAcount = 0;
            txns.forEach(txn => {
              const { refFrom, refTo, action } = txn;
              if ((refFrom && refTo) || (action == DB_AddressActivity_Actions.AM_Deposit || action == DB_AddressActivity_Actions.AM_Transfer)) {
                standardTxnAcount++;
              }
            });
            return standardTxnAcount > 0 || rewardAmount.greaterThan(ZERO);
            // return true;
          })
          .map(date => {
            const systemRewardAmount = transactions[date].systemRewardAmount;
            const rewardsTimestamp = TimestampTheEndOf(date);

            let timestamp = undefined;
            if (earliesTx) {
              timestamp = earliesTx.timestamp ?? earliesTx.addedTime;
            }
            return (<div key={date}>
              {
                (transactions[date].transactions.length > 0 || (systemRewardAmount.greaterThan(ZERO) && showNodeReward)) &&
                <>
                  <Text type="secondary">{date}</Text>
                  <br />
                </>
              }
              {
                systemRewardAmount.greaterThan(ZERO) && showNodeReward &&  (timestamp && !(rewardsTimestamp < timestamp) || !timestamp ) && <>
                  <Divider dashed style={{ marginTop: "5px", marginBottom: "5px" }} />
                  <Text strong style={{ color: "#104499" }}>{t("wallet_history_rewards")}  +{systemRewardAmount.toFixed(6)} SAFE</Text>
                  <Divider dashed style={{ marginTop: "5px", marginBottom: "20px" }} />
                </>
              }
              {
                transactions[date].transactions.length > 0 && <List
                  style={{
                    marginTop: "5px", marginBottom: "5px"
                  }}
                  bordered
                  itemLayout="horizontal"
                  dataSource={transactions[date].transactions}
                  renderItem={(item, index) => {
                    return <TransactionElement setClickTransaction={setClickTransaction} transaction={item} />
                  }}
                />
              }
            </div>)
          })
      }
    </div>

    <Modal title={t("wallet_txdetails")} closable footer={null} open={clickTransaction != null} onCancel={() => setClickTransaction(undefined)}>
      <Divider />
      {clickTransaction && <TransactionDetailsView transaction={clickTransaction} />}
    </Modal>

    <ClearHistoryConfirmModal openClearHistoryModal={openClearHistoryModal} cancel={() => { setOpenClearHistoryModal(false) }} />

  </>

}
