import { Avatar, Button, Card, Col, Divider, List, Row, Tabs, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useEffect, useState } from "react";
import SyncNode from "./SyncNode";
import TabPane from "antd/es/tabs/TabPane";

const { Text } = Typography;

export default () => {

  const data = [
    {
      title: 'Masternode 1',
    },
    {
      title: 'Masternode 2',
    },
    {
      title: 'Masternode 3',
    },
    {
      title: 'Masternode 4',
    },
    {
      title: 'Masternode 5',
    },
    {
      title: 'Masternode 6',
    },
    {
      title: 'Masternode 7',
    },
    {
      title: 'Masternode 8',
    },
    {
      title: 'Masternode 9',
    },
    {
      title: 'Masternode 10',
    },
    {
      title: 'Masternode 11',
    },
    {
      title: 'Masternode 12',
    },
  ];

  const [nodes, setNodes] = useState(data);
  const [finishedNodes, setFinishedNodes] = useState<{ title: string }[]>([]);
  const [executingNodes, setExecutingNodes] = useState<{ title: string }[]>([]);

  const startToSync = () => {
    const prepareSyncNodes = nodes.filter((node, index) => index < 3);
    const leftWaitingNodes = nodes.filter((node, index) => index >= 3);
    setNodes(leftWaitingNodes);
    setExecutingNodes(prepareSyncNodes);
  }

  const [activeKey, setActiveKey] = useState<string>();

  return <>
    <Row style={{ marginTop: "100px" }}>
      <Col span={4}>
        <Text>等待处理节点列表</Text>
        <Row>
          <Col span={22}>
            <List
              itemLayout="horizontal"
              style={{ maxHeight: "600px", overflowY: "scroll" }}
              dataSource={nodes}
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
          {Array.from(executingNodes).map((_, i) => {
            return (
              <TabPane key={i} tab={`${executingNodes[i].title}`} />
            )
          })}
        </Tabs>
        {/* 所有 SyncNode 永远挂载，只控制显示与否 */}
        {executingNodes.map((_, i) => {
          console.log("render for i =", i)
          return (
            <div key={i} style={{ display: activeKey == (i + "") ? 'block' : 'none' }}>
              <SyncNode
                i={i}
                successCallback={() => {}}
                failedCallback={() => {}}
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
              dataSource={finishedNodes}
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
