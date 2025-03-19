
import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActivePrivateKey, useWalletsActiveWallet } from '../../../state/wallets/hooks';
import { applicationActionUpdateAtCreateWallet, applicationUpdateWalletTab } from '../../../state/application/action';
import { SendOutlined, QrcodeOutlined, LockOutlined, MoreOutlined, GlobalOutlined, EditOutlined } from '@ant-design/icons';
import { useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import Locked from './tabs/Locked/Locked';
import WalletLockModal from './Lock/WalletLockModal';
import History from './tabs/History/History';
import WalletSendModal from './Send/WalletSendModal';
import { AppState } from '../../../state';
import { DateTimeFormat } from '../../../utils/DateUtils';
import { useWeb3React } from '@web3-react/core';
import { IPC_CHANNEL, Safe4_Network_Config } from '../../../config';
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
import { useTranslation } from 'react-i18next';
import useSafeScan from '../../../hooks/useSafeScan';

const { Title, Text, Paragraph, Link } = Typography;

export default () => {

  const dispatch = useDispatch();
  const { t } = useTranslation();
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
  const { URL } = useSafeScan();

  const tabItems: TabsProps['items'] = [
    {
      key: 'locked',
      label: t("wallet_lock"),
      children: <Locked />,
    },
    {
      key: 'erc20',
      label: t("wallet_tokens"),
      children: <IERC20Assets />,
    },
    {
      key: 'history',
      label: t("wallet_history"),
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
    return chainId == Safe4_Network_Config.Testnet.chainId ? <Text type='success'>{t("testnet")}</Text> : <>{t("mainnet")}</>
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
            {t("wallet_mnemonic")}
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
          {t("wallet_privateKey")}
        </a>
      ),
    });
    items.push({
      key: 'keystore',
      label: (
        <a onClick={() => {
          setOpenKeystoreModal(true);
        }} >
          {t("wallet_keystore")}
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
      window.electron.ipcRenderer.on(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ERC20TokensSignal && arg[1] == method) {
          const data = arg[2][0];
          const tokens: {
            [address: string]: {
              name: string,
              symbol: string,
              decimals: number,
              chainId: number
            }
          } = {}
          data.forEach((erc20Token: any) => {
            const { address, name, symbol, decims, chain_id } = erc20Token;
            tokens[ethers.utils.getAddress(address)] = {
              name, symbol, decimals: decims, chainId: chain_id
            }
          });
          if (Object.keys(tokens).length > 0) {
            dispatch(loadERC20Tokens(tokens))
          }
        }
      });
    }
  }, [chainId]);

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet")} <Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />
          {activeWalletName}
          <span style={{ marginLeft: "20px" }}>
            <Tooltip title={t("wallet_name_edit")}>
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
            <Text strong style={{ marginLeft: "10px" }}>{t("wallet_network_state_connecting")}</Text>
          </>
        }
        {
          !isActivating && isActive && <>
            <Text style={{ marginLeft: "10px" }}>{renderNetworkType}<Divider type='vertical' style={{ marginLeft: "12px", marginRight: "12px" }} />
              <Link onClick={() => {
                window.open(URL);
              }}> {latestBlockNumber}</Link>
            </Text>
            <Divider type='vertical' />
            <Text type='secondary'>{DateTimeFormat(timestamp * 1000)}</Text>
          </>
        }
        {
          !isActivating && !isActive && <>
            <Text strong style={{ marginLeft: "10px" }}>{t("wallet_network_state_connecterror")}</Text>
          </>
        }
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Paragraph copyable>{activeWallet?.address}</Paragraph>
          <div style={{ marginLeft: "5px" }}>
            <Safescan url={`/address/${activeWallet?.address}`} type={SafescanComponentType.Link} />
          </div>
        </Row>
        <Row>
          <Col span={18}>
            <Statistic title={t("wallet_balance")} value={balance?.toFixed(6)} />
          </Col>
          <Col span={6}>
            <Row>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<LockOutlined />} onClick={() => setOpenLockMoal(true)} /><br />
                <Text>{t("wallet_lock")}</Text>
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<SendOutlined />} onClick={() => setOpenSendModal(true)} /><br />
                <Text>{t("wallet_send")}</Text>
              </Col>
              <Col span={6} style={{ textAlign: "center" }}>
                <Button style={{
                  height: "45px", width: "45px"
                }} size='large' shape="circle" icon={<QrcodeOutlined />} onClick={() => setOpenReceiveModal(true)} /><br />
                <Text>{t("wallet_receive")}</Text>
              </Col>

              <Col span={6} style={{ textAlign: "center" }}>
                <Dropdown menu={{ items }} placement="bottomLeft">
                  <Button style={{
                    height: "45px", width: "45px"
                  }} size='large' shape="circle" icon={<MoreOutlined />} />
                </Dropdown>
                <br />
                <Text>{t("wallet_more")}</Text>
              </Col>

            </Row>

          </Col>
        </Row>
        <Row style={{ marginTop: "50px" }}>
          <Tabs style={{ width: "100%" }} activeKey={walletTab} defaultActiveKey={walletTab} items={tabItems} onChange={onChange} />
        </Row>
      </div>
    </div>

    <Modal title={t("wallet_receive")} open={openReceiveModal} width={"400px"} footer={null} closable onCancel={() => { setOpenReceiveModal(false) }}>
      <Divider />
      <Row>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} type='secondary'>{t("wallet_receive_tip0")}</Text>
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
