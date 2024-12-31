import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";
const { Text } = Typography;

const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));

export interface NormalLockParams {
  amount: string,
  lockDay: number
}

export default ({
  goNextCallback
}: {
  goNextCallback: ({ }: NormalLockParams) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const maxBalance = useMemo(() => {
    const gasPrice = JSBI.BigInt(ethers.utils.parseEther("0.00000000001").toString());
    const gasLimit = 300000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);

  const [params, setParams] = useState<NormalLockParams>({
    lockDay: 0,
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    lockDay: string | undefined,
    amount: string | undefined
  }>({
    lockDay: undefined,
    amount: undefined
  });

  const goNext = useCallback(() => {
    const { lockDay, amount } = params;
    if (!lockDay && lockDay != 0) {
      inputErrors.lockDay = t("please_enter") + t("wallet_lock_lockday");
    }
    if (!amount) {
      inputErrors.amount = t("please_enter") + t("wallet_lock_amount");
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
        if (_amount.greaterThan(maxBalance)) {
          inputErrors.amount = t("wallet_lock_amountgeavaiable");
        }
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.amount = t("enter_correct") + t("wallet_lock_amount");
        }
        // 锁仓必须大于等于1Safe
        const ONE = CurrencyAmount.ether(ethers.utils.parseEther("1").toBigInt());
        if ( !(_amount.equalTo( ONE ) || _amount.greaterThan(ONE)) ){
          inputErrors.amount = t("wallet_lock_amount_lessthen",{lessLockAmount:"1"});
        }
      } catch (error) {
        inputErrors.amount = t("enter_correct") + t("wallet_lock_amount");
      }
    }
    if (lockDay) {
      try {
        const _lockDay = JSBI.BigInt(lockDay);
        if (JSBI.greaterThan(JSBI.BigInt(0), _lockDay)) {
          inputErrors.lockDay = t("enter_correct") + t("wallet_lock_lockday");
        }
      } catch (error) {
        inputErrors.lockDay = t("enter_correct") + t("wallet_lock_lockday");
      }
    }
    if (inputErrors.amount || inputErrors.lockDay) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);

  }, [activeAccount, maxBalance, params]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message={<>
        {t("wallet_lock_tip0")}
      </>} />
      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_lock_amount")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.amount} onChange={(_input) => {
              const amountInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: amountInputValue
              })
            }} placeholder={t("enter") + t("wallet_lock_amount")} />
            <Button size="large" onClick={() => {
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: maxBalance.toFixed(18)
              })
            }}>{t("wallet_send_max")}</Button>
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>{t("wallet_current_available")}</Text>
          <br />
          <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
        {
          inputErrors?.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.amount} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_lock_lockday")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" onChange={(_input) => {
              const lockDayInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                lockDay: undefined
              })
              setParams({
                ...params,
                lockDay: Number(lockDayInputValue)
              })
            }} placeholder={t("enter") + t("wallet_lock_lockday")} />
          </Space.Compact>
        </Col>
        <Col span={10}>

        </Col>
        {
          inputErrors?.lockDay && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.lockDay} />
        }
      </Row>
      <br />
      <br />
      <br />
      <br />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={() => {
            goNext();
          }}>{t("next")}</Button>
        </Col>
      </Row>
    </div>
  </>

}
