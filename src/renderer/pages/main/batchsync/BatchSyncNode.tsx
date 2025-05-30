import { Avatar, Button, Card, Col, Divider, Input, List, Radio, RadioChangeEvent, Row, Space, Steps, Tabs, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import { CheckCircleFilled, CloseCircleFilled, CloseCircleOutlined, DeleteOutlined, EditOutlined, EditTwoTone, SyncOutlined } from "@ant-design/icons";
import useMasternodesForCreator from "../../../hooks/useMasternodesForCreator";
import { RenderNodeState } from "../supernodes/Supernodes";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc";
import BatchSSHCheck, { NodeSSHConfigValidateCheckResult } from "./BatchSSHCheck";
import { SSHCheckResult, SSHCheckStatus } from "../../../hooks/useBatchSSHCheck";

const { Text } = Typography;
// 并发同步执行数..
const concurrency = 5;

export interface SyncNodeTask {
  id: string,
  title: string,
  node: any
}

enum BatchSyncStep {
  LoadNodes = 0,
  CheckSSH = 1,
  BatchSync = 2
}

export default () => {

  const [step, setStep] = useState<number>(BatchSyncStep.LoadNodes);

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


  // 加载节点信息,以及默认的服务器配置.
  useEffect(() => {
    if (masternodesResult) {
      const { loading, finished, num, masternodes } = masternodesResult;
      const tasks = masternodes.sort((m0, m1) => m1.id - m0.id).map((masternode) => {
        return {
          id: "MN:" + masternode.id,
          title: "主节点-" + masternode.id + "123",
          node: masternode
        }
      });
      setPool({
        pendings: [...tasks],
        executings: [],
        completeds: []
      });
      if (masternodesResult.finished && masternodesResult.masternodes.length == masternodesResult.num) {
        setStep(1);
        masternodesResult.masternodes.forEach(mn => {
          nodeSSHConfigMap["MN:" + mn.id] = {
            host: "",
            port: 22,
            username: "root",
            password: ""
          }
        })
      }
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
                          <Space style={{ marginRight: "10px" }} >
                            <Button size="small" icon={<><DeleteOutlined /></>} onClick={() => {
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
          <Text>{JSON.stringify(nodeSSHConfigConnectCheckMap)}</Text>
        </Row>

        {
          step == BatchSyncStep.CheckSSH && <>
            <Card style={{ marginTop: "20px" }}>
              <BatchSSHCheck nodeSSHConfigMap={nodeSSHConfigMap}
                nodeSSHConfigValidateCheckMap={nodeSSHConfigValidateCheckMap}
                nodeSSHConfigConnectCheckMap={nodeSSHConfigConnectCheckMap}

                setNodeSSHConfigValidateCheckMap={setNodeSSHConfigValidateCheckMap}
                setNodeSSHConfigConnectCheckMap={setNodeSSHConfigConnectCheckMap} />
            </Card>
          </>
        }

        {/* <Tabs type="card" activeKey={activeKey} onChange={(key) => { setActiveKey(key) }}>
          {
            pool?.executings.map((node, i) => {
              return (
                <TabPane key={String(node.id)} tab={<><SyncOutlined spin /> {`${pool.executings[i].title}`} </>} />
              )
            })
          }
        </Tabs> */}

        {pool?.executings.map((task, i) => {
          return (
            <div key={task.id} style={{ display: activeKey == String(task.id) ? 'block' : 'none' }}>
              <SyncNode
                task={task}
                successCallback={(finishedTask) => {
                  setPool(prevPool => {
                    if (!prevPool) return prevPool;
                    const { pendings, executings, completeds } = prevPool;
                    // 从执行数组中移除
                    const newExecuting = executings.filter(task => task.id !== finishedTask.id);
                    // 将已完成数组排序
                    const newCompleted = [finishedTask, ...completeds.filter(task => task.id != finishedTask.id)]
                      .sort((taskA, taskB) => Number(taskA.id.split(":")[1]) - Number(taskB.id.split(":")[1]));
                    if (newCompleted.length == masternodesResult.masternodes.length) {
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
