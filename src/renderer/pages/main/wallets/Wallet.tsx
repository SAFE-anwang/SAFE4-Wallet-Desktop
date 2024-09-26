
import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActivePrivateKey, useWalletsActiveWallet } from '../../../state/wallets/hooks';
import { applicationActionUpdateAtCreateWallet, applicationUpdateWalletTab } from '../../../state/application/action';
import { SendOutlined, QrcodeOutlined, LockOutlined, MoreOutlined, GlobalOutlined, EditOutlined } from '@ant-design/icons';
import { useApplicationPassword, useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import Locked from './tabs/Locked/Locked';
import WalletLockModal from './Lock/WalletLockModal';
import History from './tabs/History/History';
import WalletSendModal from './Send/WalletSendModal';
import { AppState } from '../../../state';
import { DateTimeFormat } from '../../../utils/DateUtils';
import { useWeb3React } from '@web3-react/core';
import config, { IPC_CHANNEL, Safe4_Network_Config } from '../../../config';
import WalletKeystoreModal from './WalletKeystoreModal';
import WalletPrivateKeyModal from './WalletPrivateKeyModal';
import WalletMnemonicModal from './WalletMnemonicModal';
import Safescan, { SafescanComponentType } from '../../components/Safescan';
import WalletEditNameModal from './WalletEditNameModal';
import useWalletName from '../../../hooks/useWalletName';
import IERC20Assets from './tabs/IERC20/IERC20Assets';
import { ERC20TokensSignal, ERC20Tokens_Methods } from '../../../../main/handlers/ERC20TokenSignalHandler';
import { ethers } from 'ethers';
import { loadERC20Tokens } from '../../../state/transactions/actions';
import { HDNode } from 'ethers/lib/utils';

const { Safescan_URL } = config;
const { Title, Text, Paragraph, Link } = Typography;

export default () => {

  const dispatch = useDispatch();
  const activeWallet = useWalletsActiveWallet();
  const activeWalletName = useWalletName(activeWallet?.address);
  const account = useWalletsActiveAccount();
  const balance = useETHBalances([account])[account];
  const latestBlockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const walletTab = useSelector<AppState, string | undefined>(state => state.application.control.walletTab);
  const walletKeystore = useWalletsActiveKeystore();
  const { isActivating, isActive, chainId } = useWeb3React();

  const [openReceiveModal, setOpenReceiveModal] = useState<boolean>(false);
  const [openPrivateKeyModal, setOpenPrivateKeyModal] = useState<boolean>(false);
  const [openMnemonicModal, setOpenMnemonicModal] = useState<boolean>(false);
  const [openKeystoreModal, setOpenKeystoreModal] = useState<boolean>(false);

  const [openSendModal, setOpenSendModal] = useState<boolean>(false);
  const [openLockModal, setOpenLockMoal] = useState<boolean>(false);
  const [openEditNameModal, setOpenEditNameModal] = useState<boolean>(false);

  const applicationPassword = useApplicationPassword();

  const tabItems: TabsProps['items'] = [
    {
      key: 'locked',
      label: '锁仓',
      children: <Locked />,
    },
    {
      key: 'erc20',
      label: '代币',
      children: <IERC20Assets />,
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

  const renderConnectStatus = useMemo(() => {
    if (isActive) {
      return <Badge status="processing"></Badge>
    }
    if (isActivating) {
      return <Badge status='warning'></Badge>
    }
    return <Badge status='error'></Badge>
  }, [isActivating, isActive]);

  const renderNetworkType = useMemo(() => {
    return chainId == Safe4_Network_Config.Testnet.chainId ? <Text type='success'>测试网</Text> : "主网"
  }, [chainId]);

  const items: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];
    if (walletKeystore?.mnemonic) {
      items.push({
        key: 'mnemonic',
        label: (
          <a onClick={() => {
            setOpenMnemonicModal(true);
          }}>
            助记词
          </a>
        ),
      })
    }
    items.push({
      key: 'privateKey',
      label: (
        <a onClick={() => {
          setOpenPrivateKeyModal(true);
        }}>
          私钥
        </a>
      ),
    });
    items.push({
      key: 'keystore',
      label: (
        <a onClick={() => {
          setOpenKeystoreModal(true);
        }} >
          Keystore
        </a>
      ),
    })
    return items;
  }, [walletKeystore]);

  useEffect(() => {
    if (chainId) {
      // 初始化加载 ERC20_Tokens 信息;
      const method = ERC20Tokens_Methods.getAll;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ERC20TokensSignal, method, [chainId]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ERC20TokensSignal && arg[1] == method) {
          const data = arg[2][0];
          const tokens: {
            [address: string]: {
              name: string,
              symbol: string,
              decimals: number
            }
          } = {}
          data.forEach((erc20Token: any) => {
            const { address, name, symbol, decims } = erc20Token;
            tokens[ethers.utils.getAddress(address)] = {
              name, symbol, decimals: decims
            }
          });
          if ( Object.keys(tokens).length > 0 ) {
            dispatch( loadERC20Tokens(tokens) )
          }
        }
      });
    }
  }, [chainId]);

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          钱包 <Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />
          {activeWalletName}
          <span style={{ marginLeft: "20px" }}>
            <Tooltip title="编辑钱包名称">
              <Link style={{ fontSize: "18px" }} onClick={() => {
                setOpenEditNameModal(true);
              }}>
                <EditOutlined />
              </Link>
            </Tooltip>
          </span>

        </Title>

      </Col>
      <Col span={12} style={{ textAlign: "right", lineHeight: "70px" }}>
        {renderConnectStatus}
        {
          isActivating && <>
            <Text strong style={{ marginLeft: "10px" }}>正在连接</Text>
          </>
        }
        {
          !isActivating && isActive && <>
            <Text style={{ marginLeft: "10px" }}>{renderNetworkType}<Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />{latestBlockNumber}</Text>
            <Divider type='vertical' />
            <Text type='secondary'>{DateTimeFormat(timestamp * 1000)}</Text>
          </>
        }
        {
          !isActivating && !isActive && <>
            <Text strong style={{ marginLeft: "10px" }}>网络异常</Text>
          </>
        }
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          { applicationPassword }
          <Paragraph copyable>{activeWallet?.address}</Paragraph>
          <div style={{ marginLeft: "5px" }}>
            <Safescan url={`/address/${activeWallet?.address}`} type={SafescanComponentType.Link} />
          </div>
        </Row>
        <Row>
          <Col span={18}>
            <Statistic title="余额" value={balance?.toFixed(6)} />
          </Col>
          <Col span={6}>
            <Row>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<LockOutlined />} onClick={() => setOpenLockMoal(true)} /><br />
                <Text>锁仓</Text>
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<SendOutlined />} onClick={() => setOpenSendModal(true)} /><br />
                <Text>发送</Text>
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<QrcodeOutlined />} onClick={() => setOpenReceiveModal(true)} /><br />
                <Text>接收</Text>
              </Col>

              <Col span={6} style={{ textAlign: "center" }}>
                <Dropdown menu={{ items }} placement="bottomLeft">
                  <Button style={{
                    height: "45px", width: "45px"
                  }} size='large' shape="circle" icon={<MoreOutlined />} />
                </Dropdown>
                <br />
                <Text>更多</Text>
              </Col>

            </Row>

          </Col>
        </Row>
        <Row style={{ marginTop: "50px" }}>
          <Tabs style={{ width: "100%" }} activeKey={walletTab} defaultActiveKey={walletTab} items={tabItems} onChange={onChange} />
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

    {
      walletKeystore?.privateKey && <>
        <WalletPrivateKeyModal openPrivateKeyModal={openPrivateKeyModal} setOpenPrivateKeyModal={setOpenPrivateKeyModal} />
      </>
    }
    {
      walletKeystore?.mnemonic && <>
        <WalletMnemonicModal openMnemonicModal={openMnemonicModal} setOpenMnemonicModal={setOpenMnemonicModal} />
      </>
    }

    <WalletKeystoreModal openKeystoreModal={openKeystoreModal} setOpenKeystoreModal={setOpenKeystoreModal} />
    <WalletSendModal openSendModal={openSendModal} setOpenSendModal={setOpenSendModal} />
    <WalletLockModal openLockModal={openLockModal} setOpenLockModal={setOpenLockMoal} />

    <WalletEditNameModal openEditNameModal={openEditNameModal} setOpenEditNameModal={setOpenEditNameModal} />

  </>)

}
