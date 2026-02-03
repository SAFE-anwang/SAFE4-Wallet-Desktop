import { Alert, Avatar, Button, Card, Col, Divider, Input, List, Radio, RadioChangeEvent, Result, Row, Space, Spin, Steps, Tabs, Typography } from "antd";
import { useActiveAccountChildWallets, useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useMemo, useState } from "react";
import SyncNode from "./SyncNode";
import { CheckCircleFilled, CloseCircleFilled, CloseCircleOutlined, CloseCircleTwoTone, DeleteOutlined, EditOutlined, EditTwoTone, SyncOutlined } from "@ant-design/icons";
import useMasternodesForCreator from "../../../hooks/useMasternodesForCreator";
import { RenderNodeState } from "../supernodes/Supernodes";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc";
import BatchSSHCheck, { NodeSSHConfigValidateCheckResult } from "./BatchSSHCheck";
import { SSHCheckResult, SSHCheckStatus } from "../../../hooks/useBatchSSHCheck";
import { IPC_CHANNEL } from "../../../config";
import { SSHConfigSignal, SSHConfig_Methods } from "../../../../main/handlers/SSHConfigSignalHandler";
import TabPane from "antd/es/tabs/TabPane";
import LoadChildWallets from "./LoadChildWallets";
import { MasternodeInfo } from "../../../structs/Masternode";
import { TxExecuteStatus } from "../safe3/Safe3";
import { useMasternodeLogicContract, useMasternodeStorageContract } from "../../../hooks/useContracts";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { walletsUpdateForceOpen, walletsUpdateUsedChildWalletAddress } from "../../../state/wallets/action";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import EstimateTx from "../../../utils/EstimateTx";

const { Text } = Typography;
// 并发同步执行数..
const concurrency = 5;

export interface SyncNodeTask {
  id: string,
  title: string,
  node: any,
}

enum BatchSyncStep {
  LoadNodes = 0,
  CheckSSH = 1,
  BatchSync = 2
}

enum PendingFilterType {
  ALL = "all",
  Only_Error = "only_error",
  Only_Normal = "only_normal"
}

export default ({
  finishCallback,
  checkedMNIds
}: {
  finishCallback: () => void,
  checkedMNIds?: number[]
}) => {

  const [step, setStep] = useState<number>(-1);
  const activeAccount = useWalletsActiveAccount();
  const masternodesResult = useMasternodesForCreator({ creator: activeAccount, checkedMNIds: checkedMNIds });
  const masternodeLogicContract = useMasternodeLogicContract(true);
  const addTransaction = useTransactionAdder();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();

  const [activeKey, setActiveKey] = useState<string>();
  const [pool, setPool] = useState<{
    pendings: SyncNodeTask[],
    executings: SyncNodeTask[],
    completeds: SyncNodeTask[]
  }>();

  const [nodeSSHConfigMap, setNodeSSHConfigMap] = useState<{
    [id: string]: SSH2ConnectConfig
  }>({});

  const [selectTaskSSHConfig, setSelectTaskSSHConfig] = useState<string>();
  const [nodeSSHConfigValidateCheckMap, setNodeSSHConfigValidateCheckMap] = useState<{
    [id: string]: NodeSSHConfigValidateCheckResult
  }>({});
  const [nodeSSHConfigConnectCheckMap, setNodeSSHConfigConnectCheckMap] = useState<{
    [id: string]: SSHCheckResult
  }>({});
  const [hostSSHConfigMap, setHostSSHConfigMap] = useState<{
    [host: string]: SSH2ConnectConfig
  }>();

  const [nodeAddressConfigMap, setNodeAddressConfigMap] = useState<{
    [id: string]: {
      addr: string,
      address?: string,
      privKey?: string
    }
  }>();

  const [pendingFilterType, setPendingFilterType] = useState<PendingFilterType>(PendingFilterType.ALL);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [SSHConfigSignal, SSHConfig_Methods.getAll, []])
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == SSHConfigSignal && arg[1] == SSHConfig_Methods.getAll) {
        const rows = arg[2][0];
        const _hostSSHConfigMap: {
          [host: string]: SSH2ConnectConfig;
        } = {};
        Object.values(rows).forEach((row: any) => {
          const { host, port, username, password } = row;
          _hostSSHConfigMap[host] = {
            host, port, username, password
          }
        })
        setHostSSHConfigMap(_hostSSHConfigMap);
      }
    });
  }, []);

  // 加载节点信息,以及默认的服务器配置.
  useEffect(() => {
    if (masternodesResult) {
      const { loading, finished, num, masternodes } = masternodesResult;
      const tasks = masternodes.filter((m) => {
        if (pendingFilterType == PendingFilterType.ALL) {
          return true;
        }
        if (pendingFilterType == PendingFilterType.Only_Error) {
          return m.state == 2;
        }
        if (pendingFilterType == PendingFilterType.Only_Normal) {
          return m.state == 1;
        }
        return false;
      }).sort((m0, m1) => m1.id - m0.id).map((masternode) => {
        return {
          id: "MN:" + masternode.id,
          title: "主节点-" + masternode.id,
          node: masternode
        }
      });

      setPool({
        pendings: [...tasks],
        executings: [],
        completeds: []
      });

      if (masternodesResult.finished
        && hostSSHConfigMap && masternodesResult.masternodes.length == masternodesResult.num) {

        const _nodeAddressConfigMap: {
          [id: string]: {
            addr: string,
            address?: string,
            privKey?: string
          }
        } = {};
        masternodesResult.masternodes.forEach(mn => {
          const { addr, enode } = mn;
          const IP_MATCH = enode.match(/@([\d.]+):\d+/);
          const IP = IP_MATCH ? IP_MATCH[1] : null;
          const ID = "MN:" + mn.id;
          if (IP && hostSSHConfigMap[IP]) {
            const { host, port, username, password } = hostSSHConfigMap[IP];
            nodeSSHConfigMap[ID] = {
              host,
              port,
              username,
              password
            }
          } else {
            nodeSSHConfigMap[ID] = {
              host: IP ? IP : "",
              port: 22,
              username: "root",
              password: ""
            }
          }
          _nodeAddressConfigMap[ID] = {
            addr: addr
          }
        })
        setNodeAddressConfigMap(_nodeAddressConfigMap);
        setStep(BatchSyncStep.LoadNodes);
        setCommonPWD(undefined);
      }
    }
  }, [masternodesResult, hostSSHConfigMap, pendingFilterType]);

  const pendingFilterTypeOptions = useMemo(() => {
    if (masternodesResult.finished) {
      const hasErrorStateMN = masternodesResult.masternodes.filter(m => m.state == 2).length > 0;
      const hasNormalStateMN = masternodesResult.masternodes.filter(m => m.state == 1).length > 0;
      return [
        { value: PendingFilterType.ALL, label: '全部节点' },
        { value: PendingFilterType.Only_Error, label: '只处理异常节点', disabled: !hasErrorStateMN },
        { value: PendingFilterType.Only_Normal, label: '只处理正常节点', disabled: !hasNormalStateMN },
      ]
    }
  }, [masternodesResult]);

  useEffect(() => {
    if (step == BatchSyncStep.CheckSSH && pool?.pendings) {
      const pendingIds = pool.pendings.map(task => task.id);
      const _nodeSSHConfigMap = { ...nodeSSHConfigMap };
      Object.keys(nodeSSHConfigMap).filter(id => pendingIds.indexOf(id) < 0)
        .forEach(id => {
          delete _nodeSSHConfigMap[id];
        })
      setNodeSSHConfigMap({ ..._nodeSSHConfigMap });
    }
  }, [pool, step]);

  useEffect(() => {
    if (pool?.executings && pool.executings.length > 0 && pool.executings.filter(task => String(task.id) == activeKey).length == 0) {
      setActiveKey(String(pool.executings[pool.executings.length - 1].id))
    }
  }, [pool, activeKey]);

  const startToSync = () => {
    if (pool?.pendings) {
      setStep(BatchSyncStep.BatchSync);
      const pendings = pool.pendings;
      const executings = pendings.slice(0, concurrency);
      dispatch(walletsUpdateForceOpen(true));
      setActiveKey(String(executings[0].id))
      setPool({
        pendings: pendings.slice(concurrency),
        executings,
        completeds: []
      })
    }
  }

  const [nodeNewAddressEnodeMap, setNodeNewAddressEnodeMap] = useState<{
    [id: string]: {
      address: string,
      enode: string
    }
  }>({});

  const addNewAddressEnode = (id: string, newAddressEnode: {
    address: string,
    enode: string
  }) => {
    setNodeNewAddressEnodeMap(prev => {
      prev[id] = newAddressEnode
      return prev;
    });
  }

  const [nodeTxUpdates, setNodeTxUpdates] = useState<{
    [id: string]: {
      updateAddress?: TxExecuteStatus,
      updateEnode?: TxExecuteStatus
    }
  }>({});

  const addNewTxUpdate = (id: string, newTxUpdate: {
    updateAddress?: TxExecuteStatus,
    updateEnode?: TxExecuteStatus
  }) => {
    nodeTxUpdates[id] = newTxUpdate;
    setNodeTxUpdates({ ...nodeTxUpdates });
  }

  const [txUpdating, setTxUpdating] = useState<boolean>();

  const doTxUpdate = () => {
    const mnMap = masternodesResult.masternodes.reduce((map, mn) => {
      map["MN:" + mn.id] = mn;
      return map;
    }, {} as {
      [id: string]: MasternodeInfo
    });
    setTxUpdating(true);
    const asyncTxUpdate = async () => {
      if (masternodeLogicContract != null && provider && chainId) {
        const IDS = Object.keys(nodeNewAddressEnodeMap);
        for (let i = 0; i < IDS.length; i++) {
          const nodeNewAddressEncode = nodeNewAddressEnodeMap[IDS[i]];
          const nodeNewAddress = nodeNewAddressEncode.address;
          const nodeNewEnode = nodeNewAddressEncode.enode;
          const nodeOldAddress = mnMap[IDS[i]].addr;
          const nodeOldEnode = mnMap[IDS[i]].enode;
          const UpdateResult: {
            updateAddress?: TxExecuteStatus,
            updateEnode?: TxExecuteStatus
          } = {};
          console.log("Check MN Update:", IDS[i])
          if (nodeOldAddress != nodeNewAddressEncode.address) {
            try {
              const data = masternodeLogicContract.interface.encodeFunctionData("changeAddress", [
                nodeOldAddress, nodeNewAddress
              ])
              let tx: ethers.providers.TransactionRequest = {
                to: masternodeLogicContract.address,
                data,
                chainId,
              };
              tx = await EstimateTx(activeAccount, chainId, tx, provider);
              const { signedTx, error } = await window.electron.wallet.signTransaction(
                activeAccount,
                tx
              );
              if (error) {
                UpdateResult.updateAddress = {
                  error: error,
                  status: 0
                }
                addNewTxUpdate(IDS[i], UpdateResult);
              }
              if (signedTx) {
                const response = await provider.sendTransaction(signedTx);
                const { hash, data } = response;
                addTransaction({ to: masternodeLogicContract.address }, response, {
                  call: {
                    from: activeAccount,
                    to: masternodeLogicContract.address,
                    input: data,
                    value: "0"
                  }
                });
                dispatch(walletsUpdateUsedChildWalletAddress({
                  address: nodeNewAddress,
                  used: true
                }));
                UpdateResult.updateAddress = {
                  txHash: hash,
                  status: 1
                }
                addNewTxUpdate(IDS[i], UpdateResult);
              }
            } catch (err: any) {
              UpdateResult.updateAddress = {
                error: err,
                status: 0
              }
              addNewTxUpdate(IDS[i], UpdateResult);
            }
          }
          if (nodeOldEnode != nodeNewAddressEncode.enode) {
            try {
              const masternodeID = IDS[i].split(":")[1];
              const data = masternodeLogicContract.interface.encodeFunctionData("changeEnodeByID", [
                masternodeID, nodeNewEnode
              ])
              let tx: ethers.providers.TransactionRequest = {
                to: masternodeLogicContract.address,
                data,
                chainId,
              };
              tx = await EstimateTx(activeAccount, chainId, tx, provider);
              const { signedTx, error } = await window.electron.wallet.signTransaction(
                activeAccount,
                tx
              );
              if (error) {
                UpdateResult.updateEnode = {
                  error: error,
                  status: 0
                }
                addNewTxUpdate(IDS[i], UpdateResult);
              }
              if (signedTx) {
                const response = await provider.sendTransaction(signedTx);
                const { hash, data } = response;
                addTransaction({ to: masternodeLogicContract.address }, response, {
                  call: {
                    from: activeAccount,
                    to: masternodeLogicContract.address,
                    input: data,
                    value: "0"
                  }
                });
                UpdateResult.updateEnode = {
                  txHash: hash,
                  status: 1
                }
                addNewTxUpdate(IDS[i], UpdateResult);
              }
            } catch (err: any) {
              UpdateResult.updateEnode = {
                error: err,
                status: 0
              }
              addNewTxUpdate(IDS[i], UpdateResult);
            }
          }
        }
        setTxUpdating(false);
        // 完成全部节点同步...
        dispatch(walletsUpdateForceOpen(false));
        console.log("完成节点同步任务....")

      }
    }
    asyncTxUpdate();
  }

  const [commonPWD, setCommonPWD] = useState<string>();
  const applyCommonPWDForAll = useCallback(() => {
    if (commonPWD) {
      const _nodeSSHConfigMap = {
        ...nodeSSHConfigMap
      };
      Object.keys(_nodeSSHConfigMap).forEach(ID => {
        _nodeSSHConfigMap[ID].password = commonPWD;
      })
      setNodeSSHConfigMap(_nodeSSHConfigMap)
    }
  }, [commonPWD, nodeSSHConfigMap]);

  const [commonUsername, setCommonUsername] = useState<string>();
  const applyCommonUsernameForAll = useCallback(() => {
    if (commonUsername) {
      const _nodeSSHConfigMap = {
        ...nodeSSHConfigMap
      };
      Object.keys(_nodeSSHConfigMap).forEach(ID => {
        _nodeSSHConfigMap[ID].username = commonUsername;
      })
      setNodeSSHConfigMap(_nodeSSHConfigMap)
    }
  }, [commonUsername, nodeSSHConfigMap]);

  const [commonIp, setCommonIp] = useState<string>();
  const applyCommonIpForAll = useCallback(() => {
    if (commonIp) {
      const _nodeSSHConfigMap = {
        ...nodeSSHConfigMap
      };
      Object.keys(_nodeSSHConfigMap).forEach(ID => {
        _nodeSSHConfigMap[ID].host = commonIp;
      })
      setNodeSSHConfigMap(_nodeSSHConfigMap)
    }
  }, [commonIp, nodeSSHConfigMap]);


  return <>
    <Row>
      <Col span={4}>
        <Row>
          <Col span={18}>
            <Text type="secondary" strong>等待处理</Text>
          </Col>
          <Col span={6}>
            <Text>{pool?.pendings.length} / <>{`${masternodesResult.num}`}</></Text>
          </Col>
        </Row>
        <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />
        <Row>
          <Col span={22}>
            <List
              itemLayout="horizontal"
              style={{ maxHeight: "600px", overflowY: "scroll" }}
              dataSource={pool?.pendings}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={<>
                      <Row>
                        <Col span={20}>
                          {RenderNodeState(item.node.state)}
                          <Text style={{ marginLeft: "5px" }}>{item.title}</Text>
                        </Col>
                        <Col span={4} style={{ textAlign: "right" }}>
                          {nodeSSHConfigConnectCheckMap[item.id]?.status == SSHCheckStatus.Running && <><SyncOutlined spin /></>}
                          {nodeSSHConfigConnectCheckMap[item.id]?.status == SSHCheckStatus.Success && <><CheckCircleFilled style={{ color: "green" }} /></>}
                          {nodeSSHConfigConnectCheckMap[item.id]?.status == SSHCheckStatus.Failed && <><CloseCircleFilled style={{ color: "red" }} /></>}
                        </Col>
                      </Row>
                    </>}
                    description={<>
                      <Row>
                        <Col span={16}>
                          {nodeSSHConfigMap[item.id]?.host}
                        </Col>
                        <Col span={8} style={{ textAlign: "right" }}>
                          {
                            step == BatchSyncStep.CheckSSH &&
                            <Space style={{ marginRight: "10px" }} >
                              <Button disabled={Object.keys(nodeSSHConfigMap).length == 1} size="small" icon={<><DeleteOutlined /></>} onClick={() => {
                                if (step == BatchSyncStep.CheckSSH) {
                                  if (pool?.pendings) {
                                    const _newPending = pool.pendings.filter(task => task.id != item.id)
                                    setPool(({
                                      ...pool,
                                      pendings: _newPending
                                    }));
                                  }
                                }
                              }} />
                              <Button onClick={() => selectTaskSSHConfig == item.id ? setSelectTaskSSHConfig(undefined) : setSelectTaskSSHConfig(item.id)}
                                size="small" icon={
                                  <>
                                    {nodeSSHConfigValidateCheckMap[item.id]?.isValid ? <EditOutlined /> : <EditTwoTone style={{ fontSize: "26px" }} />}
                                  </>
                                } />
                            </Space>
                          }
                        </Col>
                      </Row>
                      {
                        item.id == selectTaskSSHConfig && <>
                          <Row>
                            <Col span={24}>
                              <Text type="secondary">IP</Text>
                            </Col>
                            <Col span={24}>
                              <Input value={nodeSSHConfigMap[item.id].host} onChange={(event) => {
                                const input = event.target.value;
                                const _sshConfig = {
                                  ...nodeSSHConfigMap[item.id],
                                  host: input
                                }
                                nodeSSHConfigMap[item.id] = _sshConfig;
                                setNodeSSHConfigMap({ ...nodeSSHConfigMap });
                              }} />
                            </Col>
                          </Row>
                          <Row>
                            <Col span={24}>
                              <Text type="secondary">用户名</Text>
                            </Col>
                            <Col span={24}>
                              <Input value={nodeSSHConfigMap[item.id].username} onChange={(event) => {
                                const input = event.target.value;
                                const _sshConfig = {
                                  ...nodeSSHConfigMap[item.id],
                                  username: input
                                }
                                nodeSSHConfigMap[item.id] = _sshConfig;
                                setNodeSSHConfigMap({ ...nodeSSHConfigMap });
                              }} />
                            </Col>
                          </Row>
                          <Row>
                            <Col span={24}>
                              <Text type="secondary">密码</Text>
                            </Col>
                            <Col span={24}>
                              <Input.Password value={nodeSSHConfigMap[item.id].password} onChange={(event) => {
                                const input = event.target.value;
                                const _sshConfig = {
                                  ...nodeSSHConfigMap[item.id],
                                  password: input
                                }
                                nodeSSHConfigMap[item.id] = _sshConfig;
                                setNodeSSHConfigMap({ ...nodeSSHConfigMap });
                              }} />
                            </Col>
                          </Row>
                        </>
                      }
                    </>}
                  />
                </List.Item>
              )}
            />
          </Col>
          <Col span={2}>
            <Divider type="vertical" style={{ height: "600px" }} />
          </Col>
        </Row>
      </Col>
      <Col span={16} style={{
        maxHeight: "600px", overflowY: "scroll"
      }}>
        <Row style={{ marginTop: "14px" }}>
          <Col span={24} style={{ textAlign: "center" }}>
            <Steps
              current={step}
              items={[
                {
                  title: '加载节点',
                },
                {
                  title: '检查SSH连接',
                },
                {
                  title: '批量同步',
                },
              ]}
            />
          </Col>
        </Row>
        {
          step == BatchSyncStep.LoadNodes && nodeAddressConfigMap && <>
            <LoadChildWallets nodeAddressConfigMap={nodeAddressConfigMap} setNodeAddressConfigMap={setNodeAddressConfigMap}
              finishCallback={() => setStep(BatchSyncStep.CheckSSH)} />
          </>
        }
        {
          (step == BatchSyncStep.CheckSSH) && <>
            <Card style={{ marginTop: "20px" }}>
              <Radio.Group
                value={pendingFilterType}
                options={pendingFilterTypeOptions}
                onChange={(event) => {
                  setPendingFilterType(event.target.value)
                }}
              />
              <br />
              <Row style={{ marginTop: "10px" }}>
                <Col span={8}>
                  <Input value={commonIp} placeholder="为所有节点设置相同IP" onChange={(event) => {
                    setCommonIp(event.target.value)
                  }} />
                </Col>
                <Col span={2} style={{ marginLeft: "5px" }}>
                  <Button onClick={applyCommonIpForAll}>确认</Button>
                </Col>
              </Row>
              <Row style={{ marginTop: "10px" }}>
                <Col span={8}>
                  <Input value={commonUsername} placeholder="为所有节点设置相同用户名" onChange={(event) => {
                    setCommonUsername(event.target.value)
                  }} />
                </Col>
                <Col span={2} style={{ marginLeft: "5px" }}>
                  <Button onClick={applyCommonUsernameForAll}>确认</Button>
                </Col>
              </Row>
              <Row style={{ marginTop: "10px" }}>
                <Col span={8}>
                  <Input.Password value={commonPWD} placeholder="为所有节点设置相同密码" onChange={(event) => {
                    setCommonPWD(event.target.value)
                  }} />
                </Col>
                <Col span={2} style={{ marginLeft: "5px" }}>
                  <Button onClick={applyCommonPWDForAll}>确认</Button>
                </Col>
              </Row>

              <Divider />
              <BatchSSHCheck nodeSSHConfigMap={nodeSSHConfigMap}
                nodeSSHConfigValidateCheckMap={nodeSSHConfigValidateCheckMap}
                nodeSSHConfigConnectCheckMap={nodeSSHConfigConnectCheckMap}
                startToSync={startToSync}
                setNodeSSHConfigValidateCheckMap={setNodeSSHConfigValidateCheckMap}
                setNodeSSHConfigConnectCheckMap={setNodeSSHConfigConnectCheckMap}
              />
            </Card>
          </>
        }

        {
          step == BatchSyncStep.BatchSync &&
          <>
            {
              pool && pool.executings.length > 0 &&
              <Tabs type="card" activeKey={activeKey} onChange={(key) => { setActiveKey(key) }}>
                {
                  pool?.executings.map((node, i) => {
                    return (
                      <TabPane key={String(node.id)} tab={<><SyncOutlined spin /> {`${pool.executings[i].title}`} </>} />
                    )
                  })
                }
              </Tabs>
            }
            {nodeAddressConfigMap && pool?.executings.map((task, i) => {
              return (
                <div key={task.id} style={{ display: activeKey == String(task.id) ? 'block' : 'none' }}>
                  <SyncNode
                    task={task}
                    sshConfig={nodeSSHConfigMap[task.id]}
                    addressConfig={nodeAddressConfigMap[task.id]}
                    successCallback={(finishedTask, enode: string, nodeAddress: string) => {
                      addNewAddressEnode(task.id, { address: nodeAddress, enode });
                      console.log("Add New Address Enode:", task.id, nodeAddress, enode);
                      setPool(prevPool => {
                        if (!prevPool) return prevPool;
                        const { pendings, executings, completeds } = prevPool;
                        // 从执行数组中移除
                        const newExecuting = executings.filter(task => task.id !== finishedTask.id);
                        // 将已完成数组排序
                        const newCompleted = [finishedTask, ...completeds.filter(task => task.id != finishedTask.id)]
                          .sort((taskA, taskB) => Number(taskA.id.split(":")[1]) - Number(taskB.id.split(":")[1]));
                        if (newCompleted.length == Object.keys(nodeSSHConfigMap).length) {
                          setTimeout(() => {
                            doTxUpdate();
                            console.log("Done!!")
                          }, 200);
                        }
                        // 如果还有等待任务
                        if (pendings.length > 0 && executings.length <= concurrency) {
                          const [nextTask, ...restPendings] = pendings;
                          const alreadyExecuting = newExecuting.find(task => task.id === nextTask.id);
                          if (alreadyExecuting) {
                            return {
                              pendings: restPendings,
                              executings: newExecuting,
                              completeds: newCompleted,
                            };
                          }
                          return {
                            pendings: restPendings,
                            executings: [...newExecuting, nextTask],
                            completeds: newCompleted,
                          };
                        }
                        return {
                          pendings,
                          executings: newExecuting,
                          completeds: newCompleted,
                        };
                      });
                    }}
                    failedCallback={(finishedTask) => { }}
                  />
                </div>
              );
            })}
            {
              txUpdating == false && <>
                <Result
                  status="success"
                  title="已完成节点同步"
                  extra={[
                    <Button type="primary" onClick={() => finishCallback()}>
                      关闭
                    </Button>,
                  ]}
                />
              </>
            }
            {
              Object.keys(nodeTxUpdates).length > 0 && <>
                <Spin spinning={txUpdating}>
                  <Alert type="success" message={<>
                    {
                      Object.keys(nodeTxUpdates).map(ID => {
                        const id = ID.split(":")[1];
                        const txUpdates = nodeTxUpdates[ID];
                        return <>
                          <Row key={ID}>
                            <Text strong>主节点:{id}</Text>
                            <Col span={24}>
                              {
                                txUpdates.updateAddress && <>
                                  {
                                    txUpdates.updateAddress.status == 1 && <>
                                      <Text type="secondary">{t("wallet_masternodes_sync_txhash_address")}</Text><br />
                                      <Text strong>{txUpdates.updateAddress.txHash}</Text> <br />
                                    </>
                                  }
                                  {
                                    txUpdates.updateAddress.status == 0 && <>
                                      <Text type="secondary">{t("wallet_masternodes_sync_error_address")}</Text><br />
                                      <Text strong type="danger">
                                        <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                        {txUpdates.updateAddress.error.reason}
                                      </Text> <br />
                                    </>
                                  }
                                </>
                              }
                              {
                                txUpdates.updateEnode && <>
                                  {
                                    txUpdates.updateEnode.status == 1 && <>
                                      <Text type="secondary">{t("wallet_masternodes_sync_txhash_enode")}</Text><br />
                                      <Text strong>{txUpdates.updateEnode.txHash}</Text> <br />
                                    </>
                                  }
                                  {
                                    txUpdates.updateEnode.status == 0 && <>
                                      <Text type="secondary">{t("wallet_masternodes_sync_error_enode")}</Text><br />
                                      <Text strong type="danger">
                                        <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                                        {txUpdates.updateEnode.error.reason}
                                      </Text> <br />
                                    </>
                                  }
                                </>
                              }
                            </Col>
                            <Divider />
                          </Row>
                        </>
                      })
                    }
                  </>} />
                </Spin>
              </>
            }

          </>
        }
      </Col>
      <Col span={4}>
        <Row>
          <Col span={24}>
            <Text style={{ float: "right" }} type="success" strong>完成同步</Text>
          </Col>
        </Row>
        <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />
        <Row>
          <Col span={2}>
            <Divider type="vertical" style={{ height: "600px" }} />
          </Col>
          <Col span={22}>
            <List
              itemLayout="horizontal"
              style={{ maxHeight: "600px", overflowY: "scroll" }}
              dataSource={pool?.completeds}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text>{item.title}</Text>}
                    description={<>
                      {nodeSSHConfigMap[item.id].host}
                    </>}
                  />
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Col>
    </Row >
  </>

}
