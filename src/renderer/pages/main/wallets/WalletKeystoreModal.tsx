

import { Typography, Button, Divider, Row, Col, Modal, Input, Spin, Alert } from 'antd';
import { useCallback, useState } from 'react';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const STEP_0_WARNING = 0;
const STEP_1_CONFIRMPWD = 1;
const STEP_2_SHOW = 2;

export default ({
  openKeystoreModal, setOpenKeystoreModal
}: {
  openKeystoreModal: boolean,
  setOpenKeystoreModal: (openKeystoreModal: boolean) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const [keystore, setKeystore] = useState<string>();
  const [currentStep, setCurrentStep] = useState<number>(STEP_0_WARNING);
  const [inputPWD, setInputPWD] = useState<string>();
  const [PWDError, setPWDError] = useState<string>();
  const [validating, setValidating] = useState<boolean>(false);

  const validateWalletPassword = useCallback(async () => {
    if (!inputPWD) return;
    setValidating(true);
    const result = await window.electron.wallet.viewKeystore(activeAccount, inputPWD);
    setValidating(false);
    if (!result) {
      setPWDError(t("wallet_password_error"));
      return;
    }
    setPWDError(undefined);
    setCurrentStep(STEP_2_SHOW);
    setKeystore(result);
  }, [activeAccount, inputPWD]);

  return (<>
    <Modal title="Keystore" open={openKeystoreModal} width={"400px"} footer={null} closable onCancel={() => {
      setCurrentStep(STEP_0_WARNING);
      setOpenKeystoreModal(false);
      setKeystore(undefined);
    }}>
      <Divider />
      {
        currentStep == STEP_0_WARNING && <>
          <Row>
            <Col span={24}>
              <Alert type="warning" showIcon message={<>
                <Text style={{ fontSize: "18px" }}>
                  {t("wallet_querysecret_keystore_tip")}
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
                  {t("wallet_querysecret_keystore_tip")}
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
              <Button loading={validating} onClick={validateWalletPassword} size='large' type='primary' style={{ width: "100%" }}>
                {t("wallet_querysecret_keystore_show")}
              </Button>
            </Col>
          </Row>
        </>
      }
      {
        currentStep == STEP_2_SHOW &&
        <>
          <Text type='secondary'>Keystore 使用您的钱包密码进行加密</Text>
          <br />
          <Input.TextArea value={keystore} disabled style={{ minHeight: "300px" }} />
          <Divider />
          {
            keystore && <>
              <Text copyable={{ text: keystore, icon: <>{t("wallet_querysecret_keystore_copy")}</> }}>
              </Text>
            </>
          }
        </>
      }
    </Modal>

  </>)

}
