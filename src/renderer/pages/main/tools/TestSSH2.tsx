import { useCallback, useEffect, useRef, useState } from "react"
import { IPC_CHANNEL } from "../../../config";
import { Button, Card, Col, Divider, Flex, Modal, Progress, Row, Space, Statistic, Steps, Table, TableProps, Tag, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import SSH2ShellTermial from "../../components/SSH2ShellTermial";
import SSH2CMDTerminal from "../../components/SSH2CMDTerminal";
import SSH2CMDTerminalScript from "../../components/SSH2CMDTerminalScript";
import SSH2CMDTerminalNode from "../../components/SSH2CMDTerminalNode";
import SSH2CMDTerminalNodeModal from "../../components/SSH2CMDTerminalNodeModal";
import { useWalletsActivePrivateKey } from "../../../state/wallets/hooks";
import BatchRedeemStep1 from "./BatchRedeemStep1";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Title } = Typography

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

export default () => {

  const steps = [
    {
      title: '导出私钥',
      content: 'First-content',
    },
    {
      title: '检索资产',
      content: 'First-content',
    },
    {
      title: '资产迁移',
      content: 'Second-content',
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));
  const [current, setCurrent] = useState(0);


  const [percent, setPercent] = useState<number>(0);

  const increase = () => {
    setPercent((prevPercent) => {
      const newPercent = prevPercent + 10;
      if (newPercent > 100) {
        return 100;
      }
      return newPercent;
    });
  };

  const decline = () => {
    setPercent((prevPercent) => {
      const newPercent = prevPercent - 10;
      if (newPercent < 0) {
        return 0;
      }
      return newPercent;
    });
  };

  const data: any[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
      tags: ['nice', 'developer'],
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
      tags: ['loser'],
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
      tags: ['cool', 'teacher'],
    },
  ];

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '钱包地址',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '金额',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '锁仓',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '是否主节点',
      dataIndex: 'age',
      key: 'age',
    },
  ];

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 资产迁移
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />


          <Row style={{ marginTop: "20px" }}>
            <Col span={8}>
              <Flex vertical gap="small">
                <Flex vertical gap="small">
                  <Progress percent={percent} type="circle" />
                </Flex>
                <Button.Group>
                  <Button onClick={decline} icon={<MinusOutlined />} />
                  <Button onClick={increase} icon={<PlusOutlined />} />
                </Button.Group>
              </Flex>
            </Col>
            <Col span={16}>
              <Row>
                <Col span={8}>
                  <Statistic value={4000} title="地址总数" />
                </Col>
                <Col span={8}>
                  <Statistic value={400} title="需要迁移的地址" />
                </Col>
              </Row>
              <Row style={{ marginTop: "10px" }}>
                <Col span={8}>
                  <Statistic value={302031.35} title="总资产" />
                </Col>
                <Col span={8}>
                  <Statistic value={82432.32} title="总锁仓" />
                </Col>
                <Col span={8}>
                  <Statistic value={6} title="主节点数量" />
                </Col>
              </Row>
            </Col>
          </Row>
          <Divider />
          <Table columns={columns} dataSource={data} />
          <Divider />
          <Button type="primary">下一步</Button>

        </Card>
      </div>
    </div>

  </>

}

