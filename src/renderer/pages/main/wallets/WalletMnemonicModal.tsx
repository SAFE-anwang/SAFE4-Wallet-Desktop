

import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Input, Spin, Alert } from 'antd';
import { useCallback,useState } from 'react';
import {useWalletsActiveKeystore} from '../../../state/wallets/hooks';
import { useApplicationPassword, useBlockNumber, useTimestamp } from '../../../state/application/hooks';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const STEP_0_WARNING = 0;
const STEP_1_CONFIRMPWD = 1;
const STEP_2_SHOW = 2;

export default ({
  openMnemonicModal, setOpenMnemonicModal
}: {
  openMnemonicModal: boolean,
  setOpenMnemonicModal: (openMnemonicModal: boolean) => void
}) => {

  const { t } = useTranslation();
  const walletKeystore = useWalletsActiveKeystore();

  const [currentStep, setCurrentStep] = useState<number>(STEP_0_WARNING);
  const walletPassword = useApplicationPassword();
  const [inputPWD, setInputPWD] = useState<string>();
  const [PWDError, setPWDError] = useState<string>();

  const validateWalletPassword = useCallback(() => {
    if (inputPWD == walletPassword) {
      setPWDError(undefined);
      setCurrentStep(STEP_2_SHOW);
    } else {
      setPWDError("钱包密码错误");
    }
  }, [walletPassword, inputPWD]);

  return (<>
    {
      walletKeystore?.mnemonic &&
      <Modal title="助记词" open={openMnemonicModal} width={"400px"} footer={null} closable onCancel={() => {
        setCurrentStep(STEP_0_WARNING);
        setOpenMnemonicModal(false)
      }}>
        <Divider />
        {
          currentStep == STEP_0_WARNING && <>
            <Row>
              <Col span={24}>
                <Alert type="warning" showIcon message={<>
                  <Text style={{ fontSize: "18px" }}>
                    您要查看的助记词属于高级机密信息，请确保您的电脑及正在连接的网络是安全的，并且身边没有其他人，没有摄像头正在摄像.
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
                    您要查看的助记词属于高级机密信息，请确保您的电脑及正在连接的网络是安全的，并且身边没有其他人，没有摄像头正在摄像.
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
                <Button onClick={validateWalletPassword} size='large' type='primary' style={{ width: "100%" }}>显示助记词</Button>
              </Col>
            </Row>
          </>
        }
        {
          currentStep == STEP_2_SHOW && <>
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
          </>
        }
      </Modal>
    }

  </>)

}
