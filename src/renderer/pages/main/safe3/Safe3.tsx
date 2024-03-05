
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useState } from "react";

const { Text, Title } = Typography;


const steps = [
  {
    title: '查询地址',
    content: 'First-content',
  },
  {
    title: '验证私钥',
    content: 'Second-content',
  },
  {
    title: '上传合约',
    content: 'Last-content',
  },
];

export default () => {

  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  const contentStyle: React.CSSProperties = {
    lineHeight: '260px',
    textAlign: 'center',
    marginTop: 16,
  };

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          Safe3 兑换
        </Title>
      </Col>
    </Row>


    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Text>使用Safe3网络的钱包地址的私钥对信息进行签名</Text><br />
            <Text>验证通过的签名信息会将Safe3网络的锁仓置换到Safe4网络的当前钱包地址上</Text>
          </>} />
        </Card>
        <Divider />
        <Card>

          <Steps current={current} items={items} />
          <div style={contentStyle}>{steps[current].content}</div>
          <div style={{ marginTop: 24 }}>
            {current < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" onClick={() => message.success('Processing complete!')}>
                Done
              </Button>
            )}
            {current > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                Previous
              </Button>
            )}
          </div>

        </Card>
      </div>
    </div>
  </>)

}
