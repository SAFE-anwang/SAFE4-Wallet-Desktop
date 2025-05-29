import { Avatar, Button, Card, Col, Divider, Input, List, Radio, RadioChangeEvent, Row, Space, Steps, Tabs, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import { DeleteOutlined, EditTwoTone, SyncOutlined } from "@ant-design/icons";
import useMasternodesForCreator from "../../../hooks/useMasternodesForCreator";
import { RenderNodeState } from "../supernodes/Supernodes";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc";
import BatchSSHCheck from "./BatchSSHCheck";

const { Text } = Typography;

export interface SyncNodeTask {
  id: number,
  title: string,
  node: any
}
const concurrency = 5;

const style: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const masternodesResult = useMasternodesForCreator({ creator: activeAccount });
  const [step, setStep] = useState<number>(0);

  const [activeKey, setActiveKey] = useState<string>();
  const [pool, setPool] = useState<{
    pendings: SyncNodeTask[],
    executings: SyncNodeTask[],
    completeds: SyncNodeTask[]
  }>();

  const [nodeSSHConfigMap, setNodeSSHConfigMap] = useState<{
    [id: number]: SSH2ConnectConfig
  }>({});
  const [selectTaskSSHConfig, setSelectTaskSSHConfig] = useState<number>();

  useEffect(() => {
    if (masternodesResult) {
      const { loading, finished, num, masternodes } = masternodesResult;
      const tasks = masternodes.sort((m0, m1) => m1.id - m0.id).map((masternode) => {
        return {
          id: masternode.id,
          title: "主节点-" + masternode.id,
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
          nodeSSHConfigMap[mn.id] = {
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
    if (pool?.executings && pool.executings.length > 0 && pool.executings.filter(task => String(task.id) == activeKey).length == 0) {
      setActiveKey(String(pool.executings[pool.executings.length - 1].id))
    }
  }, [pool, activeKey])

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
                      {RenderNodeState(item.node.state)}
                      <Text style={{ marginLeft: "10px" }}>{item.title}</Text>
                    </>}
                    description={<>
                      <Row>
                        <Col span={12}>{nodeSSHConfigMap[item.id].host}</Col>
                        <Col span={12} style={{ textAlign: "right" }}>
                          <Space style={{ marginRight: "20px" }} >
                            <Button size="small" icon={<><DeleteOutlined /></>} />
                            <Button onClick={() => selectTaskSSHConfig == item.id ? setSelectTaskSSHConfig(undefined) : setSelectTaskSSHConfig(item.id)}
                              size="small" icon={<><EditTwoTone /></>} />
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
        </Row>

        {
          step == 1 && <>
            <Card style={{ marginTop: "20px" }}>

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
                      .sort((taskA, taskB) => taskA.id - taskB.id);
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

    <BatchSSHCheck />

  </>

}
