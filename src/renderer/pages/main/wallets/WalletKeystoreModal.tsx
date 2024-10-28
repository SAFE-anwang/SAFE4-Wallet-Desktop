

import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Input, Spin, Alert } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActivePrivateKey, useWalletsActiveSigner, useWalletsActiveWallet } from '../../../state/wallets/hooks';
import { applicationActionUpdateAtCreateWallet, applicationUpdateWalletTab } from '../../../state/application/action';
import { SendOutlined, QrcodeOutlined, LockOutlined, MoreOutlined } from '@ant-design/icons';
import { useApplicationPassword, useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import { ethers } from 'ethers';

const { Title, Text, Paragraph } = Typography;

const STEP_0_WARNING = 0;
const STEP_1_CONFIRMPWD = 1;
const STEP_2_SHOW = 2;

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

  const [currentStep, setCurrentStep] = useState<number>(STEP_0_WARNING);
  const walletPassword = useApplicationPassword();
  const [inputPWD, setInputPWD] = useState<string>();
  const [PWDError, setPWDError] = useState<string>();

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
  }, []);

  const validateWalletPassword = useCallback(() => {
    if (inputPWD == walletPassword) {
      setPWDError(undefined);
      setCurrentStep(STEP_2_SHOW);
    } else {
      setPWDError("钱包密码错误");
    }
  }, [walletPassword, inputPWD]);

  return (<>
    <Modal title="Keystore" open={openKeystoreModal} width={"400px"} footer={null} closable onCancel={() => {
      setCurrentStep(STEP_0_WARNING);
      setOpenKeystoreModal(false);
    }}>
      <Divider />

      {
        currentStep == STEP_0_WARNING && <>
          <Row>
            <Col span={24}>
              <Alert type="warning" showIcon message={<>
                <Text style={{ fontSize: "18px" }}>
                  您要查看的 Keystore 属于钱包高级机密信息，请确保您的电脑及正在连接的网络是安全的，并且身边没有其他人，没有摄像头正在摄像.
                </Text>
              </>} />
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Button onClick={() => setCurrentStep(STEP_1_CONFIRMPWD)} size='large' type='primary' style={{ width: "100%" }}>确认安全,可以显示</Button>
            </Col>
          </Row>
        </>
      }

      {
        currentStep == STEP_1_CONFIRMPWD && <>
          <Row>
            <Col span={24}>
              <Alert type="warning" showIcon message={<>
                <Text style={{ fontSize: "18px" }}>
                  您要查看的 Keystore 属于高级机密信息，请确保您的电脑及正在连接的网络是安全的，并且身边没有其他人，没有摄像头正在摄像.
                </Text>
              </>} />
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Input.Password placeholder='输入钱包密码' size='large' onChange={(event) => {
                const inputPWD = event.target.value;
                setInputPWD(inputPWD);
                setPWDError(undefined);
              }} />
              {
                PWDError && <Alert style={{ marginTop: "5px" }} showIcon type='error' message={PWDError} />
              }
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Button onClick={validateWalletPassword} size='large' type='primary' style={{ width: "100%" }}>显示 Keystore</Button>
            </Col>
          </Row>
        </>
      }

      {
        currentStep == STEP_2_SHOW &&
        <>
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
        </>
      }

    </Modal>

  </>)

}
