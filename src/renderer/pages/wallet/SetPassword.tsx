import { Alert, Button, Col, Divider, Input, Row, Tag, Typography } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useApplicationAfterSetPasswordTODO } from "../../state/application/hooks";
import { useCallback, useMemo, useState } from "react";
import { AfterSetPasswordTODO } from "../../state/application/reducer";
import { useDispatch } from "react-redux";
import { applicationSetPassword } from "../../state/application/action";

const { Text } = Typography;

export const PasswordRegex = /.{8,}/;

// export const PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export default () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const afterSetPasswordTODO = useApplicationAfterSetPasswordTODO();

    const [password, setPassword] = useState<{
        passwordInput?: string,
        passwordConfirm?: string
    }>();
    const [inputErrors, setInputErrors] = useState<{
        passwordInput?: string,
        passwordConfirm?: string
    }>();

    const goBackClick = () => {
        navigate("/selectCreateWallet")
    }

    const goNextClick = () => {
        if (passwordCheck() && password?.passwordInput){
            dispatch( applicationSetPassword(password.passwordInput) )
            if ( afterSetPasswordTODO == AfterSetPasswordTODO.CREATE ){
                navigate("/wallet/createMnemonic")
            }else if ( afterSetPasswordTODO == AfterSetPasswordTODO.IMPORT ){
                navigate("/wallet/importWallet")
            }
        }
    }

    const nextClickAble = useMemo(() => {
        if (password) {
            return password.passwordConfirm && password.passwordInput;
        }
        return false;
    }, [password]);

    const passwordCheck = useCallback(() => {
        if (password?.passwordInput && password.passwordConfirm) {
            const { passwordInput, passwordConfirm } = password;
            if (!PasswordRegex.test(passwordInput)) {
                setInputErrors({
                    ...inputErrors,
                    passwordInput: "密码长度必须大于8,且必须包含大小写字母及特殊符号"
                });
                return false;
            }
            if (passwordConfirm != passwordInput) {
                setInputErrors({
                    ...inputErrors,
                    passwordConfirm: "两次密码输入不一致"
                });
                return false;
            }
            setInputErrors(undefined);
            return true;
        }
        return false;
    }, [password]);

    return <>
        <Button style={{ marginTop: "14px" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
        <Row style={{
            marginTop: "20px"
        }}>
            <Col span={14}>
                <Row>
                    <Col span={20}>
                        <Text style={{
                            fontSize: "28px"
                        }} strong>设置密码</Text>
                        <br /> <br /> <br /> <br />
                        <Input.Password onChange={(event) => {
                            setPassword({
                                ...password,
                                passwordInput: event.target.value
                            })
                            setInputErrors({
                                ...inputErrors,
                                passwordInput: undefined
                            })
                        }} placeholder="至少8位字符" size="large" style={{
                            height: "56px"
                        }} />
                        <br />
                        {
                            inputErrors?.passwordInput && <>
                                <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                                    {inputErrors?.passwordInput}
                                </>} />
                            </>
                        }
                        <br /> <br />
                        <Input.Password onChange={(event) => {
                            setPassword({
                                ...password,
                                passwordConfirm: event.target.value
                            });
                            setInputErrors({
                                ...inputErrors,
                                passwordConfirm: undefined
                            })
                        }} placeholder="确认密码" size="large" style={{
                            height: "56px"
                        }} />
                        <br />
                        {
                            inputErrors?.passwordConfirm && <>
                                <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                                    {inputErrors?.passwordConfirm}
                                </>} />
                            </>
                        }
                        <br /> <br />
                        <Button disabled={!nextClickAble} type="primary" onClick={goNextClick} style={{
                            width: "100%", height: "56px", fontSize: "18px"
                        }}>继续</Button>
                    </Col>
                    <Col span={4}>
                        <Divider style={{ height: "100%", float: "right", border: "2px solid #ededed" }} type="vertical" />
                    </Col>
                </Row>
            </Col>
            <Col span={10} style={{
                paddingLeft: "20px"
            }}>
                <Tag style={{
                    width: "40px", height: "40px", borderRadius: "20px", marginTop: "6px", background: "#b5ffb4", border: "1px solid #b5ffb4"
                }}>
                    <LockOutlined style={{
                        color: "green", marginTop: "12px", marginLeft: "6px"
                    }} />
                </Tag>
                <br /><br /><br />
                <Text style={{ fontSize: "18px" }}>
                    您的数据将使用此密码加密，确认交易和解锁钱包也会使用该密码。
                </Text>
                <br /><br />
                <Text style={{ fontSize: "18px" }}>
                    密码安全地存储在您的设备上。我们无法为您恢复密码，
                    <Text strong type="danger" style={{ fontSize: "20px" }}>所以请务必记住它！</Text>
                </Text>
            </Col>
        </Row>
    </>
}
