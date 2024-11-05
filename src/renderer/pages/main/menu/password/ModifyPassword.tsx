import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Input, Result, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  LeftOutlined
} from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import { useApplicationPassword } from '../../../../state/application/hooks';
import { PasswordRegex } from '../../../wallet/SetPassword';
import { useWalletsKeystores } from '../../../../state/wallets/hooks';
import { IPC_CHANNEL } from '../../../../config';
import { Wallet_Methods, WalletSignal } from '../../../../../main/handlers/WalletSignalHandler';
import { useDispatch } from 'react-redux';
import { applicationSetPassword } from '../../../../state/application/action';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const password = useApplicationPassword();
  const walletsKeystores = useWalletsKeystores();
  const dispatch = useDispatch();

  const [inputParams, setInputParams] = useState<{
    inputPwd: string,
    inputNewPwd: string,
    confirmNewPwd: string
  }>({
    inputPwd: "",
    inputNewPwd: "",
    confirmNewPwd: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    inputPwd?: string,
    inputNewPwd?: string
    confirmNewPwd?: string,
  }>();

  const [modifing, setModifing] = useState<boolean>(false);
  const [modifyResult, setModifyResult] = useState<{
    success?: boolean,
    path?: string,
    reason?: string
  }>();

  const modifyPassword = useCallback(() => {
    const { inputPwd, inputNewPwd, confirmNewPwd } = inputParams;
    const inputErrors: {
      inputPwd?: string,
      inputNewPwd?: string,
      confirmNewPwd?: string
    } = {};
    if (password != inputPwd) {
      inputErrors.inputPwd = t("wallet_modifypwd_pwderror");
    }
    if (!PasswordRegex.test(inputNewPwd)) {
      inputErrors.inputNewPwd = t("wallet_modifypwd_pwdnotmatch");
    }
    if (confirmNewPwd != inputNewPwd) {
      inputErrors.confirmNewPwd = t("wallet_modifypwd_newpwdnotsame");
    }
    if (inputErrors.inputPwd || inputErrors.inputNewPwd || inputErrors.confirmNewPwd) {
      setInputErrors({
        ...inputErrors
      });
      return;
    }
    setModifing(true);
    const method = Wallet_Methods.storeWallet;
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, method, [walletsKeystores, inputNewPwd]]);
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == WalletSignal && arg[1] == method) {
        const data = arg[2][0];
        const { success, path, reason } = data;
        setModifyResult(data);
        setModifing(false);
        if (success) {
          dispatch(applicationSetPassword(inputNewPwd));
        }
      }
    });

  }, [inputParams, password, walletsKeystores, dispatch]);

  return <>


    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/menu")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_modifypwd")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        {
          modifyResult && modifyResult.success &&
          <Result
            status="success"
            title={t("wallet_modifypwd_success")}
            subTitle={t("wallet_modifypwd_success_tip")}
          />
        }
        {
          !modifyResult &&
          <Card style={{ marginBottom: "20px" }}>
            <Spin spinning={modifing}>
              <Row>
                <Col span={24}>
                  <Text type='secondary'>{t("wallet_modifypwd_current")}</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' value={inputParams.inputPwd} placeholder={t("enter") + t("wallet_modifypwd_current")} onChange={(event) => {
                    const input = event.target.value;
                    setInputParams({
                      ...inputParams,
                      inputPwd: input
                    })
                    setInputErrors({
                      ...inputErrors,
                      inputPwd: undefined
                    })
                  }} />
                  {
                    inputErrors?.inputPwd &&
                    <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors.inputPwd} />
                  }
                </Col>
              </Row>
              <Row style={{ marginTop: "20px" }}>
                <Col span={24}>
                  <Text type='secondary'>{t("wallet_modifypwd_new")}</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' placeholder={t("enter") + t("wallet_modifypwd_new")} onChange={(event) => {
                    const input = event.target.value;
                    setInputParams({
                      ...inputParams,
                      inputNewPwd: input
                    })
                    setInputErrors({
                      ...inputErrors,
                      inputNewPwd: undefined
                    })
                  }} />
                  {
                    inputErrors?.inputNewPwd &&
                    <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors.inputNewPwd} />
                  }
                </Col>
              </Row>
              <Row style={{ marginTop: "20px" }}>
                <Col span={24}>
                  <Text type='secondary'>{t("wallet_modifypwd_confirm")}</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' placeholder={t("wallet_modifypwd_confirm_placehold")} onChange={(event) => {
                    const input = event.target.value;
                    setInputParams({
                      ...inputParams,
                      confirmNewPwd: input
                    })
                    setInputErrors({
                      ...inputErrors,
                      confirmNewPwd: undefined
                    })
                  }} />
                  {
                    inputErrors?.confirmNewPwd &&
                    <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors.confirmNewPwd} />
                  }
                </Col>
              </Row>
              <Row style={{ marginTop: "20px" }}>
                <Col span={24}>
                  <Button type='primary' onClick={modifyPassword}>{t("wallet_modifypwd_doconfirm")}</Button>
                </Col>
              </Row>
            </Spin>
          </Card>
        }
      </div>
    </div>
  </>
}
