import { Button, Col, Divider, Input, Row, Typography, Space, Alert } from "antd"
import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { CurrencyAmount, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import { useTokenBalance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import AddressView from "../../../../components/AddressView";
import { useTranslation } from "react-i18next";
import AddressComponent from "../../../../components/AddressComponent";

const { Text } = Typography;
const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));

export default ({
  token,
  goNextCallback
}: {
  token: Token,
  goNextCallback: (inputParams: {
    to: string,
    amount: string
  }) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountTokenAmount = useTokenBalance(activeAccount, token);

  const [params, setParams] = useState<{
    to: string,
    amount: string,
  }>({
    to: "",
    amount: "",
  });
  const [inputErrors, setInputErrors] = useState<{
    to: string | undefined,
    amount: string | undefined,
  }>({
    to: undefined,
    amount: undefined,
  });

  const goNext = useCallback(() => {
    const { to, amount } = params;
    if (!to || !ethers.utils.isAddress(to)) {
      inputErrors.to = t("enter_correct") + t("wallet_address");
    }
    if (!amount) {
      inputErrors.amount = t("enter") + t("wallet_send_amount");
    }
    if (amount && activeAccountTokenAmount) {
      try {
        let _amount = new TokenAmount(token, ethers.utils.parseUnits(amount, token.decimals).toBigInt());
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
        }
        if (_amount.greaterThan(activeAccountTokenAmount)) {
          inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
        }
      } catch (error) {
        inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
      }
    }
    if (inputErrors.to || inputErrors.amount) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);
  }, [activeAccount, activeAccountTokenAmount, params]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message={t("wallet_tokens_send_tip", { tokenName: token.symbol })} />
      <br />
      <Row >
        <Col span={24}>
          <Text type="secondary">{t("wallet_tokens_contract")}</Text>
          <br />
          <AddressComponent style={{ fontSize: "16px" }} address={token.address} copyable qrcode />
        </Col>
      </Row>
      <Divider />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_from")}</Text>
          <br />
          <AddressComponent style={{ fontSize: "16px" }} address={activeAccount} copyable qrcode />
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_to")}</Text>
          <br />
          <Input size="large" onChange={(_input) => {
            const toInputValue = _input.target.value;
            setParams({
              ...params,
              to: toInputValue
            });
            setInputErrors({
              ...inputErrors,
              to: undefined
            })
          }} placeholder={t("wallet_send_to_placeholder")}></Input>
        </Col>
        {
          inputErrors?.to && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.to} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_send_amount")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.amount} onChange={(_input) => {
              const toInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: toInputValue
              })
            }} placeholder={t("enter") + t("wallet_send_amount")} />
            {
              activeAccountTokenAmount &&
              <Button size="large" onClick={() => {
                setInputErrors({
                  ...inputErrors,
                  amount: undefined
                })
                setParams({
                  ...params,
                  amount: activeAccountTokenAmount.toExact()
                })
              }}>{t("wallet_send_max")}</Button>
            }
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>{t("wallet_balance_currentavailable")}</Text>
          <br />
          <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountTokenAmount?.toFixed(2)}
          </Text>
        </Col>
        {
          inputErrors?.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.amount} />
        }
      </Row>
      <br />
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={goNext}>{t("next")}</Button>
        </Col>
      </Row>
    </div>
  </>

}
