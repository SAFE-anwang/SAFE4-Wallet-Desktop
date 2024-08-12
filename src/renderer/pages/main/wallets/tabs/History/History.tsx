import { List, Typography, Modal, Divider, Switch, Row, Col, Button, Tooltip } from "antd";
import TransactionElement from "./TransactionElement";
import { useEffect, useMemo, useState } from "react";
import TransactionDetailsView from "./TransactionDetailsView";
import { useDispatch, useSelector } from "react-redux";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useTransactions } from "../../../../../state/transactions/hooks";
import { useBlockNumber } from "../../../../../state/application/hooks";
import { Activity2Transaction, AddressActivityFetch, TransactionDetails } from "../../../../../state/transactions/reducer";
import { DBAddressActivitySignal, DB_AddressActivity_Actions, DB_AddressActivity_Methods } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
import { IPC_CHANNEL } from "../../../../../config";
import { refreshAddressTimeNodeReward, reloadTransactionsAndSetAddressActivityFetch } from "../../../../../state/transactions/actions";
import "./index.css"
import { AppState } from "../../../../../state";
import { ZERO } from "../../../../../utils/CurrentAmountUtils";
import { fetchAddressAnalytic, fetchAddressAnalyticNodeRewards } from "../../../../../services/address";
import { useWeb3React } from "@web3-react/core";
import { AddressAnalyticVO, DateTimeNodeRewardVO } from "../../../../../services";
import { TimestampTheStartOf } from "../../../../../utils/DateUtils";
import { TimeNodeRewardSignal, TimeNodeReward_Methods } from "../../../../../../main/handlers/TimeNodeRewardHandler";
import useSafeScan from "../../../../../hooks/useSafeScan";
import { DeleteOutlined } from "@ant-design/icons";
import ClearHistoryConfirmModal from "./ClearHistoryConfirmModal";

const { Text } = Typography;

export default () => {

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

  useEffect(() => {
    const addressActivtiesLoadActivities = DB_AddressActivity_Methods.loadActivities;
    const timeNodeRewardsGetAll = TimeNodeReward_Methods.getAll;

    if (activeAccount && chainId) {
      if (activeAccount != addressActivityFetch?.address) {
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [DBAddressActivitySignal, addressActivtiesLoadActivities, [activeAccount]]);
      }
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [TimeNodeRewardSignal, timeNodeRewardsGetAll, [activeAccount, chainId]]);
      return window.electron.ipcRenderer.on(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == DBAddressActivitySignal && arg[1] == addressActivtiesLoadActivities) {
          const rows = arg[2][0];
          console.log(`Load [${activeAccount}] AddressActivities From DB : `, rows);
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
          console.log("dbStoredRange ::", dbStoredRange);
          dispatch(reloadTransactionsAndSetAddressActivityFetch({
            txns,
            addressActivityFetch: {
              address: activeAccount,
              blockNumberStart: dbStoredRange.end,
              blockNumberEnd: latestBlockNumber == 0 ? 99999999 : latestBlockNumber,
              current: 1,
              pageSize: 500,
              status: 0,
              dbStoredRange
            }
          }));
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
  }, [activeAccount, chainId])

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
        <Switch checkedChildren="开启" unCheckedChildren="关闭" value={showNodeReward} style={{ float: "left" }}
          onChange={setShowNodeReward} />
        <Text style={{ marginLeft: "5px", float: "left" }}>显示挖矿奖励</Text>
      </Col>
      <Col span={12} style={{ textAlign: "right" }}>
        <Tooltip title="清空该地址关联的历史记录,然后将自动从浏览器接口重新同步.">
          <Button onClick={() => setOpenClearHistoryModal(true)} type="dashed" icon={<DeleteOutlined />}>清空记录</Button>
        </Tooltip>
      </Col>
    </Row>
    {
      Object.keys(transactions).sort((d1, d2) => TimestampTheStartOf(d2) - TimestampTheStartOf(d1))
        .filter( date => {
          const txns =  transactions[date].transactions;
          const rewardAmount = transactions[date].systemRewardAmount;
          let standardTxnAcount = 0;
          txns.forEach( txn => {
            const { refFrom , refTo , action } = txn;
            if ( (refFrom && refTo) || (action == DB_AddressActivity_Actions.AM_Deposit || action == DB_AddressActivity_Actions.AM_Transfer ) ){
              standardTxnAcount ++;
            }
          });
          return standardTxnAcount > 0 || rewardAmount.greaterThan(ZERO) ;
          // return true;
        })
        .map(date => {
          const systemRewardAmount = transactions[date].systemRewardAmount;
          return (<div key={date}>
            {
              (transactions[date].transactions.length > 0 || (systemRewardAmount.greaterThan(ZERO) && showNodeReward)) &&
              <>
                <Text type="secondary">{date}</Text>
                <br />
              </>
            }
            {
              systemRewardAmount.greaterThan(ZERO) && showNodeReward && <>
                <Divider dashed style={{ marginTop: "5px", marginBottom: "5px" }} />
                <Text strong style={{ color: "#104499" }}>挖矿奖励  +{systemRewardAmount.toFixed(6)} SAFE</Text>
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

    <Modal title="交易明细" closable footer={null} open={clickTransaction != null} onCancel={() => setClickTransaction(undefined)}>
      <Divider />
      {clickTransaction && <TransactionDetailsView transaction={clickTransaction} />}
    </Modal>

    <ClearHistoryConfirmModal openClearHistoryModal={openClearHistoryModal} cancel={() => { setOpenClearHistoryModal(false) }} />

  </>

}
