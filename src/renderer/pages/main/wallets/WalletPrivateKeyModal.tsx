

import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Input, Spin } from 'antd';
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

const { Title, Text, Paragraph } = Typography;

export default ({
  openPrivateKeyModal, setOpenPrivateKeyModal
}: {
  openPrivateKeyModal: boolean,
  setOpenPrivateKeyModal: (openPrivateKeyModal: boolean) => void
}) => {

  const privateKey = useWalletsActivePrivateKey();

  return (<>
    <Modal title="私钥" open={openPrivateKeyModal} width={"400px"} footer={null} closable onCancel={() => { setOpenPrivateKeyModal(false) }}>
      <Divider />
      <Row>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} type='danger'>不要将您的私钥暴露给任何人。</Text>
      </Row>
      <Row style={{ width: "300px", textAlign: "center", margin: "auto" }}>
        <Text style={{ margin: "auto", marginTop: "20px", marginBottom: "20px" }} strong>
          {privateKey && privateKey.replace("0x", "")}
        </Text>
        <br />
      </Row>
    </Modal>
  </>)

}
