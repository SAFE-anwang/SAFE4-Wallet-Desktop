
import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveWallet } from '../../../state/wallets/hooks';
import { applicationActionUpdateAtCreateWallet, applicationUpdateWalletTab } from '../../../state/application/action';
import {  SendOutlined, QrcodeOutlined , LockOutlined } from '@ant-design/icons';
import { useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import Locked from './tabs/Locked/Locked';
import WalletLockModal from './Lock/WalletLockModal';
import History from './tabs/History/History';
import WalletSendModal from './Send/WalletSendModal';
import { AppState } from '../../../state';
import { useWeb3Hooks } from '../../../connectors/hooks';
import { DateTimeFormat } from '../../../utils/DateUtils';

const { Title, Text, Paragraph } = Typography;

export default () => {

  const dispatch = useDispatch();
  const activeWallet = useWalletsActiveWallet();
  const account = useWalletsActiveAccount();
  const balance = useETHBalances([account])[account];
  const latestBlockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const walletTab = useSelector<AppState , string|undefined>( state => state.application.control.walletTab );

  const [openReceiveModal, setOpenReceiveModal] = useState<boolean>(false);
  const [openSendModal, setOpenSendModal] = useState<boolean>(false);
  const [openLockModal, setOpenLockMoal] = useState<boolean>(false);

  const items: TabsProps['items'] = [
    {
      key: 'locked',
      label: '锁仓',
      children: <Locked />,
    },
    {
      key: 'history',
      label: '历史',
      children: <History />,
    },
  ];

  const onChange = (key: string) => {
    dispatch(applicationUpdateWalletTab(key))
  };

  useEffect(() => {
    dispatch(applicationActionUpdateAtCreateWallet(false));
  }, []);

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          钱包 <Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />
          {activeWallet?.name}
        </Title>
      </Col>
      <Col span={12} style={{ textAlign: "right", lineHeight: "70px" }}>
        <Badge status="processing"></Badge>
        <Text style={{ marginLeft: "10px" }}>区块高度<Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />{latestBlockNumber}</Text>
        <Divider type='vertical' />
        <Text type='secondary'>{DateTimeFormat(timestamp * 1000)}</Text>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Paragraph copyable>{activeWallet?.address}</Paragraph>
        </Row>
        <Row>
          <Col span={18}>
            <Statistic title="余额" value={balance?.toFixed(6)} />
          </Col>
          <Col span={6}>
            <Row>
              <Col span={8} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<LockOutlined />}onClick={() => setOpenLockMoal(true)}/><br />
                <Text>锁仓</Text>
              </Col>
              <Col span={8} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<SendOutlined />} onClick={() => setOpenSendModal(true)} /><br />
                <Text>发送</Text>
              </Col>
              <Col span={8} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<QrcodeOutlined />} onClick={() => setOpenReceiveModal(true)} /><br />
                <Text>接收</Text>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row style={{ marginTop: "50px" }}>
          <Tabs style={{ width: "100%" }} activeKey={walletTab} defaultActiveKey={walletTab} items={items} onChange={onChange} />
        </Row>
      </div>
    </div>

    <Modal title="接收" open={openReceiveModal} width={"400px"} footer={null} closable onCancel={() => { setOpenReceiveModal(false) }}>
      <Divider />
      <Row>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} type='secondary'>资产只能在相同的网络中发送。</Text>
      </Row>
      <Row style={{ textAlign: "center" }}>
        {
          activeWallet && <QRCode size={200} style={{ margin: "auto", boxShadow: "5px 5px 10px 2px rgba(0, 0, 0, 0.2)" }} value={activeWallet.address} />
        }
      </Row>
      <Row style={{ width: "200px", textAlign: "center", margin: "auto" }}>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} strong>
          {activeWallet?.address}
        </Text>
        <br />
      </Row>
    </Modal>

    <WalletSendModal openSendModal={openSendModal} setOpenSendModal={setOpenSendModal} />
    <WalletLockModal openLockModal={openLockModal} setOpenLockModal={setOpenLockMoal} />

  </>)

}
