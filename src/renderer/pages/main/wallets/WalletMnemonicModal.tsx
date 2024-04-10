

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
import { text } from 'node:stream/consumers';

const { Title, Text, Paragraph } = Typography;

export default ({
  openMnemonicModal, setOpenMnemonicModal
}: {
  openMnemonicModal: boolean,
  setOpenMnemonicModal: (openMnemonicModal: boolean) => void
}) => {
  const walletKeystore = useWalletsActiveKeystore();
  return (<>
    {
      walletKeystore?.mnemonic && <Modal title="助记词" open={openMnemonicModal} width={"400px"} footer={null} closable onCancel={() => { setOpenMnemonicModal(false) }}>
        <Divider />
        <Row style={{ width: "300px", textAlign: "left", margin: "auto" }}>
          {
            walletKeystore.mnemonic.split(" ")
              .map((word, index) => {
                return <>
                  <Col key={word} span={12}>
                    <Row>
                      <Col span={4}>
                        <Text type='secondary'>{index + 1}.</Text>
                      </Col>
                      <Col span={20}>
                        <Text strong>{word}</Text>
                      </Col>
                    </Row>
                  </Col>
                </>
              })
          }
        </Row>
        <Divider />
        {
          walletKeystore.password && <>
            <Row style={{ width: "300px", textAlign: "left", margin: "auto", marginTop: "20px" }}>
              <Col span={24}>
                <Text type='secondary' style={{ marginRight: "10px" }}>种子密码</Text>
              </Col>
              <Col span={24}>
                <Text strong>
                  {walletKeystore.password}
                </Text>
              </Col>
            </Row>
          </>
        }

        <Row style={{ width: "300px", textAlign: "left", margin: "auto", marginTop: "20px" }}>
          <Col span={24}>
            <Text type='secondary' style={{ marginRight: "10px" }}>BIP44-Path</Text>
          </Col>
          <Col span={24}>
            <Text strong>
              {walletKeystore.path}
            </Text>
          </Col>
        </Row>

      </Modal>
    }

  </>)

}
