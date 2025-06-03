import { Avatar, Button, Card, Col, Divider, Input, List, Radio, RadioChangeEvent, Row, Space, Steps, Tabs, Typography } from "antd";
import { useActiveAccountChildWallets, useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import { CheckCircleFilled, CloseCircleFilled, CloseCircleOutlined, DeleteOutlined, EditOutlined, EditTwoTone, SyncOutlined } from "@ant-design/icons";
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

export default () => {

  const [step, setStep] = useState<number>(-1);
  const activeAccount = useWalletsActiveAccount();
  const masternodesResult = useMasternodesForCreator({ creator: activeAccount });

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
      const tasks = masternodes.sort((m0, m1) => m1.id - m0.id).map((masternode) => {
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
      }
    }
  }, [masternodesResult, hostSSHConfigMap]);

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

  const doTxUpdate = () => {
    const mnMap = masternodesResult.masternodes.reduce((map, mn) => {
      map["MN:" + mn.id] = mn;
      return map;
    }, {} as {
      [id: string]: MasternodeInfo
    });
    Object.keys(nodeNewAddressEnodeMap).forEach(id => {
      const nodeNewAddressEncode = nodeNewAddressEnodeMap[id];
      const nodeOldAddress = mnMap[id].addr;
      const nodeOldEnode = mnMap[id].enode;
      if (nodeOldAddress != nodeNewAddressEncode.address) {
        console.log("Need Update Node Address for :", id)
      }
      if (nodeOldEnode != nodeNewAddressEncode.enode) {
        console.log("Need Update Node Enode for :", id)
      }
    });
  }

  return <>
    <Row style={{ marginTop: "100px" }}>
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
                        <Col span={12}>
                          {nodeSSHConfigMap[item.id].host}
                        </Col>
                        <Col span={12} style={{ textAlign: "right" }}>
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
      <Col span={16}>
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
          step == BatchSyncStep.CheckSSH && <>
            <Card style={{ marginTop: "20px" }}>
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

            <Tabs type="card" activeKey={activeKey} onChange={(key) => { setActiveKey(key) }}>
              {
                pool?.executings.map((node, i) => {
                  return (
                    <TabPane key={String(node.id)} tab={<><SyncOutlined spin /> {`${pool.executings[i].title}`} </>} />
                  )
                })
              }
            </Tabs>
            {nodeAddressConfigMap && pool?.executings.map((task, i) => {
              return (
                <div key={task.id} style={{ display: activeKey == String(task.id) ? 'block' : 'none' }}>
                  <SyncNode
                    task={task}
                    sshConfig={nodeSSHConfigMap[task.id]}
                    addressConfig={nodeAddressConfigMap[task.id]}
                    successCallback={(finishedTask, enode: string, nodeAddress: string) => {
                      addNewAddressEnode(task.id, { address: nodeAddress, enode });
                      setPool(prevPool => {
                        if (!prevPool) return prevPool;
                        const { pendings, executings, completeds } = prevPool;
                        // 从执行数组中移除
                        const newExecuting = executings.filter(task => task.id !== finishedTask.id);
                        // 将已完成数组排序
                        const newCompleted = [finishedTask, ...completeds.filter(task => task.id != finishedTask.id)]
                          .sort((taskA, taskB) => Number(taskA.id.split(":")[1]) - Number(taskB.id.split(":")[1]));
                        if (newCompleted.length == Object.keys(nodeSSHConfigMap).length) {
                          doTxUpdate();
                          console.log("Done!!")
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
                    title={<a>{item.title}</a>}
                    description=""
                  />
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Col>
    </Row>

  </>

}
