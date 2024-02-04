import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps } from "antd";
import { useNavigate } from "react-router-dom";
import ProposalList from "./ProposalList";

const { Text, Title } = Typography;

export default () => {

  const navigate = useNavigate();

  const items: TabsProps['items'] = [
    {
      key: 'list',
      label: '提案列表',
      children: <ProposalList />,
    },
    {
      key: 'myproposals',
      label: '我的提案',
      children: <ProposalList queryMyProposals={true} />,
    },
  ];

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          提案
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Text>支付 <Text strong>1 SAFE</Text> 来创建提案从资金池里获取SAFE</Text><br />
            <Text>只有在线且排名前49的超级节点才可以进行投票</Text>
          </>} />
          <Divider />
          <Button onClick={() => {
            navigate("/main/proposals/create")
          }}>发起提案</Button>
        </Card>
        <Card>
          <Tabs items={items}></Tabs>
        </Card>
      </div>
    </div>

  </>)

}
