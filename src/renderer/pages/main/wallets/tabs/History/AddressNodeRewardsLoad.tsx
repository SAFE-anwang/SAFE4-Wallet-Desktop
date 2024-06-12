import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react"
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { TimeNodeRewardSignal, TimeNodeReward_Methods } from "../../../../../../main/handlers/TimeNodeRewardHandler";
import { IPC_CHANNEL } from "../../../../../config";
import { useDispatch } from "react-redux";
import { refreshAddressTimeNodeReward } from "../../../../../state/transactions/actions";
import { fetchAddressAnalytic } from "../../../../../services/address";
import { AddressAnalyticVO } from "../../../../../services";

export default () => {

  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const dispatch = useDispatch();

  useEffect(() => {
    if (chainId && activeAccount) {
      const method = TimeNodeReward_Methods.getAll;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [TimeNodeRewardSignal, method, [activeAccount, chainId]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == TimeNodeRewardSignal && arg[1] == method) {
          const rows = arg[2][0];
          const dbNodeRewardsMap : {
            [time : string]: string
          } = {};
          const dbTimeNodeRewards = rows.map((row: any) => {
            dbNodeRewardsMap[row.time_key] = row.amount;
            return {
              ...row,
              time: row.time_key,
              rewardAmount: row.amount,
              rewardCount: row.count,
            }
          });
          console.log("TimeNodeRewards In DB =>", dbNodeRewardsMap);
          // 将加载的 DB 数据更新到 state
          dispatch(refreshAddressTimeNodeReward({
            chainId,
            address: activeAccount,
            nodeRewards: dbTimeNodeRewards
          }));

          // 远程访问浏览器接口,获取新的数据
          fetchAddressAnalytic({ address: activeAccount.toLocaleLowerCase() })
            .then((data: AddressAnalyticVO) => {
              const nodeRewards = data.nodeRewards;
              console.log(`Query [${activeAccount}] Node Rewards : `, nodeRewards);
              dispatch(refreshAddressTimeNodeReward({
                chainId,
                address: activeAccount,
                nodeRewards: data.nodeRewards
              }));
              // 将访问的数据更新到数据库
              const method = TimeNodeReward_Methods.saveOrUpdate;
              const saveOrUpdateNodeRewards = nodeRewards.filter(nodeReward => {
                const { time, rewardAmount } = nodeReward;
                const _time = time.split(" ")[0];
                console.log(`compare time=${_time} in map=${dbNodeRewardsMap[_time]} ?`)
                if (!dbNodeRewardsMap[_time]) {
                  return true;
                }
                if (dbNodeRewardsMap[_time] && dbNodeRewardsMap[_time] != rewardAmount) {
                  return true;
                }
                return false;
              }).map(nodeReward => {
                return {
                  address: activeAccount,
                  amount: nodeReward.rewardAmount,
                  count: nodeReward.rewardCount,
                  time: nodeReward.time.split(" ")[0]
                }
              })
              console.log("save or update noderewards => ", saveOrUpdateNodeRewards)
              // window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [TimeNodeRewardSignal, method, [
              //   saveOrUpdateNodeRewards
              //   , chainId]]);
            })
        }
      });
    }
  }, [chainId, activeAccount]);


  return <></>
}
