

import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Input, Spin, Alert } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActivePrivateKey, useWalletsActiveSigner, useWalletsActiveWallet } from '../../../state/wallets/hooks';
import { applicationActionUpdateAtCreateWallet, applicationUpdateWalletTab } from '../../../state/application/action';
import { SendOutlined, QrcodeOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons';
import { useApplicationPassword, useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import Locked from './tabs/Locked/Locked';
import WalletLockModal from './Lock/WalletLockModal';
import History from './tabs/History/History';
import { useWeb3React } from '@web3-react/core';
import { Safe4_Network_Config } from '../../../config';
import { ethers } from 'ethers';
import { text } from 'node:stream/consumers';

const { Title, Text, Paragraph } = Typography;

export default ({
  openKeystoreModal, setOpenKeystoreModal
}: {
  openKeystoreModal: boolean,
  setOpenKeystoreModal: (openKeystoreModal: boolean) => void
}) => {

  const privateKey = useWalletsActivePrivateKey();
  const [keystore, setKeystore] = useState<string>();
  const [encrypting, setEncrypting] = useState<boolean>(false);
  const password = useApplicationPassword();

  useEffect(() => {
    if (privateKey) {
      setKeystore(undefined);
      const ethersWallet = new ethers.Wallet(privateKey);
      setEncrypting(true);
      ethersWallet.encrypt(password ? password : "").then((keystore: any) => {
        setKeystore(keystore);
        setEncrypting(false);
      });
    } else {
      setKeystore(undefined);
    }
  }, [privateKey, password]);

  useEffect(() => {
    return () => {
      setKeystore(undefined);
    }
  } , [])

  return (<>
    <Modal title="Keystore" open={openKeystoreModal} width={"400px"} footer={null} closable onCancel={() => { setOpenKeystoreModal(false) }}>
      <Divider />
      {
        encrypting && <>
          <Text type='secondary'>正在执行使用您设置的钱包密码加密并导出Keystore标准文件</Text>
          <br /><br />
        </>
      }
      <Spin spinning={encrypting}>
        <Input.TextArea value={keystore} disabled style={{ minHeight: "300px" }} />
      </Spin>
      <Divider />
      {
        keystore && <>
          <Text copyable={{ text: keystore, icon: <>复制 Keystore 到剪切板</> }}>
          </Text>
        </>
      }
    </Modal>

  </>)

}
