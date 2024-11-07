import { Alert, Button, Col, Divider, Input, Row, Tag, Typography } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { useApplicationAfterSetPasswordTODO } from "../../state/application/hooks";
import { useCallback, useMemo, useState } from "react";
import { AfterSetPasswordTODO } from "../../state/application/reducer";
import { useDispatch } from "react-redux";
import { applicationSetPassword } from "../../state/application/action";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

// export const PasswordRegex = /.{8,}/;
export const PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export default () => {
  const { t } = useTranslation();
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
    if (passwordCheck() && password?.passwordInput) {
      dispatch(applicationSetPassword(password.passwordInput))
      if (afterSetPasswordTODO == AfterSetPasswordTODO.CREATE) {
        navigate("/wallet/createMnemonic")
      } else if (afterSetPasswordTODO == AfterSetPasswordTODO.IMPORT) {
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
          passwordInput: t("wallet_password_rule")
        });
        return false;
      }
      if (passwordConfirm != passwordInput) {
        setInputErrors({
          ...inputErrors,
          passwordConfirm: t("wallet_password_error_confirmnotmatch")
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
            }} strong>{t("wallet_password_set")}</Text>
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
            }} placeholder={t("enter") + t("wallet_password")} size="large" style={{
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
            }} placeholder={t("wallet_password_confirm")} size="large" style={{
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
            }}>{t("next")}</Button>
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
          {t("wallet_password_tip0")}
        </Text>
        <br /><br />
        <Text style={{ fontSize: "18px" }}>
          {t("wallet_password_tip1")}
          <Text strong type="danger" style={{ fontSize: "20px" }}>{t("wallet_password_tip2")}</Text>
        </Text>
      </Col>
    </Row>
  </>
}
