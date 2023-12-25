
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal } from 'antd';
import { useEffect } from 'react';
import { doNewAccount } from '../../services/accounts'
import { useAccounts, useBlockNumber, useSysInfo, useWalletList } from '../../state/application/hooks';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export default () => {

  const navigate = useNavigate();

  async function callDoNewAccount() {
    navigate("/selectCreateWallet");
  }
  const blockNumber = useBlockNumber();
  const accounts = useAccounts();
  const sysInfo = useSysInfo();

  const walletsList = useWalletList();

  useEffect(() => {

  }, [])

  return (<>
    <Title level={4} style={{ marginTop: "0px" }}>Accounts</Title>
    <br />
    {
      JSON.stringify(walletsList)
    }
    <Divider />
    <Row>
      <Col span={24}>
        <Statistic title="Total Safe Value Amount" value={112893} />
      </Col>
    </Row>
    <br />
    <br />
    <Row>
      <Col span={6}>
        <Statistic title="Balance" value={112893} precision={2} />
      </Col>
      <Col span={6}>
        <Statistic title="Avaiable" value={112893} precision={2} />
      </Col>
      <Col span={6}>
        <Statistic title="Locked" value={112893} precision={2} />
      </Col>
      <Col span={6}>
        <Statistic title="Used" value={112893} precision={2} />
      </Col>
    </Row>
    <br />
    <br />

    <Card title={`Accounts (${accounts.length})`} extra={<Button onClick={callDoNewAccount} type='dashed'>+ New Account</Button>}>
      {

      }
    </Card>



  </>)

}
