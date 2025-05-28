import { Avatar, Button, Card, Col, Divider, List, Row, Tabs, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useCallback, useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import TabPane from "antd/es/tabs/TabPane";
import { SyncOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface SyncNodeTask {
  id: number,
  title: string,
}

const concurrency = 5;

export default () => {

  const [activeKey, setActiveKey] = useState<string>();

  const [pool, setPool] = useState<{
    pendings: SyncNodeTask[],
    executings: SyncNodeTask[],
    completeds: SyncNodeTask[]
  }>();

  const tasks = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    title: `主节点 ${i + 1}`,
  }));

  useEffect(() => {
    setPool({
      pendings: [...tasks],
      executings: [],
      completeds: []
    });
  }, []);

  const startToSync = () => {
    if (pool?.pendings) {
      const pendings = pool.pendings;
      const executings = pendings.slice(0, concurrency);
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
                    description=""
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
        <Tabs type="card" activeKey={activeKey} onChange={(key) => {setActiveKey(key)}}>
          {
            pool?.executings.map((node, i) => {
              return (
                <TabPane key={String(node.id)} tab={<><SyncOutlined spin /> {`${pool.executings[i].title}`} </>} />
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
                    // 从执行数组中移除
                    const newExecuting = executings.filter(task => task.id !== finishedTask.id);
                    // 将已完成数组排序
                    const newCompleted = [finishedTask, ...completeds.filter(task => task.id != finishedTask.id)]
                      .sort((taskA, taskB) => taskB.id - taskA.id);
                    if (newCompleted.length == tasks.length) {
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
