import { Button, Col, Divider, Input, Row, Typography, Space, Alert, Switch } from "antd"
import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import AddressView from "../../../components/AddressView";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));
export default ({
  goNextCallback
}: {
  goNextCallback: (inputParams: {
    to: string,
    amount: string ,
    lockDay : number | undefined
  }) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];

  const maxBalance = useMemo(() => {
    const gasPrice = JSBI.BigInt(ethers.utils.parseEther("0.00000000001").toString());
    const gasLimit = 21000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);

  const [params, setParams] = useState<{
    to: string,
    amount: string,
    lockDay: number | undefined
  }>({
    to: "",
    amount: "",
    lockDay: undefined
  });

  const [inputErrors, setInputErrors] = useState<{
    to: string | undefined,
    amount: string | undefined,
    lockDay: string | undefined
  }>({
    to: undefined,
    amount: undefined,
    lockDay: undefined
  });

  const [openSendLock, setOpenSendLock] = useState<boolean>(false);

  const goNext = useCallback(() => {
    const { to, amount , lockDay } = params;
    if (!to || !ethers.utils.isAddress(to)) {
      inputErrors.to = t("wallet_send_entercorrectwalletaddress");
    }
    if (!amount) {
      inputErrors.amount = t("please_enter")+t("wallet_send_amount");
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
        if (_amount.greaterThan(maxBalance)) {
          inputErrors.amount = t("wallet_send_amountgeavaiable");
        }
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.amount = t("enter_correct")+t("wallet_send_amount");
        }
      } catch (error) {
        inputErrors.amount = t("enter_correct")+t("wallet_send_amount");
      }
    }
    if ( openSendLock && ( !lockDay || Number.isNaN(lockDay) ) ){
      inputErrors.lockDay = t("enter_correct")+t("wallet_lock_lockday");
    }
    if (inputErrors.to || inputErrors.amount || inputErrors.lockDay) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);
  }, [activeAccount, maxBalance, params , openSendLock]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message={t("wallet_send_tip0")} />
      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_send_from")}</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={activeAccount}></AddressView>
          </Text>
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
            }} placeholder={`${t("enter")+" "+t("wallet_send_amount")}`} />
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
          <Switch size="small" checkedChildren={t("active")} unCheckedChildren={t("unactive")} defaultChecked={openSendLock}
            onClick={(value) => {
              setOpenSendLock(value);
              setParams({
                ...params,
                lockDay: undefined
              });
              setInputErrors({
                ...inputErrors,
                lockDay: undefined
              })
            }} />
          <Text style={{ marginLeft: "5px" }} strong>{t("wallet_lock")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input value={params.lockDay} disabled={!openSendLock} size="large" onChange={(_input) => {
              const lockDayInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                lockDay: undefined
              })
              setParams({
                ...params,
                lockDay: Number(lockDayInputValue)
              })
            }} placeholder={t("wallet_send_lockday_placeholder")} />
          </Space.Compact>
        </Col>
        <Col span={10}>

        </Col>
        {
          inputErrors?.lockDay && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.lockDay} />
        }
      </Row>

      <Divider />

      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={goNext}>{t("next")}</Button>
        </Col>
      </Row>

    </div>
  </>

}
