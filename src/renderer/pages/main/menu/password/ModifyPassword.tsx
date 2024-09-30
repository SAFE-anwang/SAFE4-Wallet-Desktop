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

const { Title, Text } = Typography;

export default () => {

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
      inputErrors.inputPwd = "密码错误";
    }
    if (!PasswordRegex.test(inputNewPwd)) {
      inputErrors.inputNewPwd = "密码长度必须大于8,且必须包含大小写字母及特殊符号";
    }
    if (confirmNewPwd != inputNewPwd) {
      inputErrors.confirmNewPwd = "两次输入的新密码不一致";
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
          修改钱包密码
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        {
          modifyResult && modifyResult.success &&
          <Result
            status="success"
            title="密码修改成功!"
            subTitle="钱包文件已使用您新设置的密码进行加密"
          />
        }
        {
          !modifyResult &&
          <Card style={{ marginBottom: "20px" }}>
            <Spin spinning={modifing}>
              <Row>
                <Col span={24}>
                  <Text type='secondary'>钱包当前密码</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' value={inputParams.inputPwd} placeholder='输入当前密码' onChange={(event) => {
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
                  <Text type='secondary'>钱包新密码</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' placeholder='输入新密码' onChange={(event) => {
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
                  <Text type='secondary'>确认钱包新密码</Text>
                </Col>
                <Col span={24}>
                  <Input.Password size='large' placeholder='再次输入新密码' onChange={(event) => {
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
                  <Button type='primary' onClick={modifyPassword}>确认修改</Button>
                </Col>
              </Row>
            </Spin>
          </Card>
        }
      </div>
    </div>
  </>
}
