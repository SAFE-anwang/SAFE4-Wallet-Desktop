

import { Typography, Button, Divider, Statistic, Row, Col, Modal, Tabs, TabsProps, QRCode, Badge, Dropdown, Input, Spin, Alert } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActiveWallet } from '../../../state/wallets/hooks';
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
  const activeAccount = useWalletsActiveAccount();
  const activeWallet = useWalletsActiveWallet();
  const [currentStep, setCurrentStep] = useState<number>(STEP_0_WARNING);
  const [inputPWD, setInputPWD] = useState<string>();
  const [PWDError, setPWDError] = useState<string>();

  const [result, setResult] = useState<[string, string | undefined, string]>();

  const validateWalletPassword = useCallback(async () => {
    if (!inputPWD) return;
    const result = await window.electron.wallet.viewMnemonic(activeAccount, inputPWD);
    if (!result) {
      setPWDError(t("wallet_password_error"));
      return;
    }
    setPWDError(undefined);
    setCurrentStep(STEP_2_SHOW);
    setResult(result);
  }, [activeAccount, inputPWD]);

  return (<>
    {
      activeWallet?.path &&
      <Modal title={t("wallet_mnemonic")} destroyOnClose open={openMnemonicModal} width={"400px"} footer={null} closable onCancel={() => {
        setCurrentStep(STEP_0_WARNING);
        setOpenMnemonicModal(false);
        setResult(undefined);
        setInputPWD(undefined);
      }}>
        <Divider />
        {
          currentStep == STEP_0_WARNING && <>
            <Row>
              <Col span={24}>
                <Alert type="warning" showIcon message={<>
                  <Text style={{ fontSize: "18px" }}>
                    {t("wallet_querysecret_mnemonic_tip")}
                  </Text>
                </>} />
              </Col>
              <Col span={24} style={{ marginTop: "20px" }}>
                <Button onClick={() => setCurrentStep(STEP_1_CONFIRMPWD)} size='large' type='primary' style={{ width: "100%" }}>
                  {t("wallet_querysecret_confirm_safety")}
                </Button>
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
                    {t("wallet_querysecret_mnemonic_tip")}
                  </Text>
                </>} />
              </Col>
              <Col span={24} style={{ marginTop: "20px" }}>
                <Input.Password placeholder={t("wallet_password_input")} size='large' onChange={(event) => {
                  const inputPWD = event.target.value;
                  setInputPWD(inputPWD);
                  setPWDError(undefined);
                }} />
                {
                  PWDError && <Alert style={{ marginTop: "5px" }} showIcon type='error' message={PWDError} />
                }
              </Col>
              <Col span={24} style={{ marginTop: "20px" }}>
                <Button onClick={validateWalletPassword} size='large' type='primary' style={{ width: "100%" }}>
                  {t("wallet_querysecret_mnemonic_show")}
                </Button>
              </Col>
            </Row>
          </>
        }
        {
          currentStep == STEP_2_SHOW && result && <>
            <Row style={{ width: "300px", textAlign: "left", margin: "auto" }}>
              {
                result[0].split(" ")
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
              result[1] && <>
                <Row style={{ width: "300px", textAlign: "left", margin: "auto", marginTop: "20px" }}>
                  <Col span={24}>
                    <Text type='secondary' style={{ marginRight: "10px" }}>{t("wallet_mnemonic_password")}</Text>
                  </Col>
                  <Col span={24}>
                    <Text strong>
                      {result[1]}
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
                  {result[2]}
                </Text>
              </Col>
            </Row>
          </>
        }
      </Modal>
    }

  </>)

}
