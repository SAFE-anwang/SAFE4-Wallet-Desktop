import { Avatar, Button, Card, Col, Divider, List, Row, Tabs, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import TabPane from "antd/es/tabs/TabPane";

const { Text } = Typography;

export interface SyncNodeTask {
  id: number,
  title: string,
}

export default () => {

  const [activeKey, setActiveKey] = useState<string>();

  const [pool, setPool] = useState<{
    pendings: SyncNodeTask[],
    executings: SyncNodeTask[],
    completeds: SyncNodeTask[]
  }>();


  useEffect(() => {
    const tasks = Array.from({ length: 500 }).map((_, i) => ({
      id: i,
      title: `任务${i + 1}`,
    }));
    setPool({
      pendings: [...tasks],
      executings: [],
      completeds: []
    });
  }, []);

  const startToSync = () => {
    if (pool?.pendings) {
      const pendings = pool.pendings;
      const executings = pendings.slice(0, 5);
      setPool({
        pendings: pendings.slice(5),
        executings,
        completeds: []
      })
    }
  }

  return <>
    <Row style={{ marginTop: "100px" }}>
      <Col span={4}>
        <Text>等待处理节点列表</Text>
        <Row>
          <Col span={22}>
            <List
              itemLayout="horizontal"
              style={{ maxHeight: "600px", overflowY: "scroll" }}
              dataSource={pool?.pendings}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={<a>{item.title}</a>}
                    description="11111"
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
        <Text>正在同步节点</Text>
        <Button onClick={startToSync}>开始</Button>
        <Tabs type="card" activeKey={activeKey} onChange={(key) => { setActiveKey(key) }}>
          {
            pool?.executings.map((node, i) => {
              return (
                <TabPane key={String(node.id)} tab={`${pool.executings[i].title}`} />
              )
            })
          }
        </Tabs>
        {pool?.executings.map((task, i) => {
          return (
            <div key={task.id} style={{ display: activeKey == String(task.id) ? 'block' : 'none' }}>
              <SyncNode
                task={task}
                successCallback={(finishedTask) => {
                  setPool(prevPool => {
                    if (!prevPool) return prevPool;
                    const { pendings, executings, completeds } = prevPool;
                    // 移除执行完成的任务
                    const newExecuting = executings.filter(task => task.id !== finishedTask.id);
                    const newCompleted = [finishedTask, ...completeds.filter( task => task.id != finishedTask.id) ].sort( (taskA,taskB) => taskB.id - taskA.id ) ;

                    // 如果还有等待任务
                    if (pendings.length > 0 && executings.length <= 5) {
                      const [nextTask, ...restPendings] = pendings;
                      // 防止重复添加（某些回调并发触发）
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
        <Text>完成处理节点列表</Text>
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
                    description="11111"
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
