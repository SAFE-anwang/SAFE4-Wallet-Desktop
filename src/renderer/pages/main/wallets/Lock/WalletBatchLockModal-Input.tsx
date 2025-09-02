import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import { DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { DateFormat, GetNextMonth } from "../../../../utils/DateUtils";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

// eslint-disable-next-line arrow-body-style
const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf('month');
};

const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));

export interface BatchLockParams {
  perLockAmount: string,
  lockTimes: number,
  startLockMonth: string,
  periodMonth: number,
  toAddress: string
}

export function BatchLockAert({
  batchLockParams
}: {
  batchLockParams: BatchLockParams
}) {
  const { t } = useTranslation();
  const { perLockAmount, lockTimes, startLockMonth, periodMonth } = batchLockParams;
  let _totalLockAmount = "0";
  let _perLockAmount = "0";
  if (perLockAmount && lockTimes && lockTimes > 0) {
    try {
      const JSBI_PerLockAmount = JSBI.BigInt(ethers.utils.parseEther(perLockAmount).toString());
      const JSBI_TotalLockAmount = JSBI.multiply(JSBI_PerLockAmount, JSBI.BigInt(lockTimes));
      _totalLockAmount = CurrencyAmount.ether(JSBI_TotalLockAmount).toExact();
      _perLockAmount = perLockAmount;
    } catch (err: any) {

    }
  }
  return <Alert type="warning" message={<>
    <Row>
      <Col span={24}>
        <Text>
          {t("wallet_batchLock_desc0", { startLockMonth, periodMonth, _perLockAmount })}
        </Text>
      </Col>
      <Col span={24}>
        <Text>
          {t("wallet_batchLock_desc1", { lockTimes, _totalLockAmount })}
        </Text>
      </Col>
    </Row>
  </>}></Alert>
}


export default ({
  goNextCallback
}: {
  goNextCallback: ({ }: BatchLockParams) => void
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const maxBalance = useMemo(() => {
    const gasPrice = JSBI.BigInt(ethers.utils.parseEther("0.00000000001").toString());
    const gasLimit = 5000000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);

  const [params, setParams] = useState<BatchLockParams>({
    perLockAmount: "",
    lockTimes: 36,
    startLockMonth: GetNextMonth(),
    periodMonth: 1,
    toAddress: activeAccount
  });
  const [inputErrors, setInputErrors] = useState<{
    lockTimes: string | undefined,
    perLockAmount: string | undefined,
    startLockMonth: string | undefined,
    periodMonth: string | undefined,
    toAddress: string | undefined,
  }>({
    lockTimes: undefined,
    perLockAmount: undefined,
    startLockMonth: undefined,
    periodMonth: undefined,
    toAddress: undefined
  });
  const [totalLockAmount, setTotalLockAmount] = useState<string>("0");

  const goNext = useCallback(() => {

    const { perLockAmount, lockTimes, startLockMonth, periodMonth, toAddress } = params;

    if (!perLockAmount) {
      inputErrors.perLockAmount = t("please_enter") + t("wallet_batchLock_eachLockAmount");
    }
    if (!lockTimes || !(lockTimes > 0) || (lockTimes > 360) ) {
      inputErrors.lockTimes = t("please_enter") + t("wallet_batchLock_totalLockCount");
    }
    if (!startLockMonth) {
      inputErrors.lockTimes = "请选择锁仓起始月份";
    }
    if (!toAddress || !ethers.utils.isAddress(toAddress)) {
      inputErrors.toAddress = t("enter_correct") + t("wallet_batchLock_lockWalletAddress");
    }
    if (!periodMonth || !(periodMonth > 0) || periodMonth > 12) {
      inputErrors.periodMonth = "请输入锁仓间隔月份";
    }
    if (perLockAmount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(perLockAmount).toBigInt());
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.perLockAmount = t("enter_correct") + t("wallet_lock_amount");
        }
        // 锁仓必须大于等于1Safe
        const ONE = CurrencyAmount.ether(ethers.utils.parseEther("0.01").toBigInt());
        if (!(_amount.equalTo(ONE) || _amount.greaterThan(ONE))) {
          inputErrors.perLockAmount = t("wallet_lock_amount_lessthen", { lessLockAmount: "0.01" });
        }
      } catch (error) {
        inputErrors.perLockAmount = t("enter_correct") + t("wallet_lock_amount");
      }
    }
    if (inputErrors.perLockAmount || inputErrors.lockTimes || inputErrors.startLockMonth || inputErrors.periodMonth || inputErrors.toAddress) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);
  }, [activeAccount, maxBalance, params, totalLockAmount]);

  useEffect(() => {
    const { perLockAmount, lockTimes } = params;
    if (perLockAmount && lockTimes && lockTimes > 0) {
      try {
        const JSBI_PerLockAmount = JSBI.BigInt(ethers.utils.parseEther(perLockAmount).toString());
        const JSBI_TotalLockAmount = JSBI.multiply(JSBI_PerLockAmount, JSBI.BigInt(lockTimes));
        const totalLockAmount = CurrencyAmount.ether(JSBI_TotalLockAmount);
        setTotalLockAmount(totalLockAmount.toExact())
      } catch (err: any) {
        setTotalLockAmount("0")
      }
    }
  }, [params]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_batchLock_eachLockAmount")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" onChange={(_input) => {
              const perLockAmountInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                perLockAmount: undefined
              })
              setParams({
                ...params,
                perLockAmount: perLockAmountInputValue
              })
            }} placeholder={t("enter") + t("wallet_batchLock_eachLockAmount")} />
          </Space.Compact>
        </Col>
        <Col span={10}>
        </Col>
        {
          inputErrors?.perLockAmount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.perLockAmount} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_batchLock_totalLockCount")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input value={params.lockTimes} size="large" onChange={(_input) => {
              const lockTimesInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                lockTimes: undefined
              })
              setParams({
                ...params,
                lockTimes: Number(lockTimesInputValue)
              })
            }} />
          </Space.Compact>
        </Col>
        <Col span={10}>
        </Col>
        {
          inputErrors?.lockTimes && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.lockTimes} />
        }
      </Row>

      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_batchLock_totalLockAmount")}</Text>
          <br />
          <Text strong style={{ float: "left", fontSize: "18px", lineHeight: "36px" }}>
            {totalLockAmount} SAFE
          </Text>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>{t("wallet_current_available")}</Text>
          <br />
          <Text type="secondary" style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
      </Row>

      <br />
      <Row >
        <Col span={24}>
          <Text strong>{t("wallet_batchLock_lockWalletAddress")}</Text>
          <br />
          <Input value={params.toAddress} size="large" onChange={(_input) => {
            const toInputValue = _input.target.value;
            setParams({
              ...params,
              toAddress: toInputValue
            });
            setInputErrors({
              ...inputErrors,
              toAddress: undefined
            })
          }} placeholder={t("enter") + t("wallet_batchLock_lockWalletAddress")}></Input>
        </Col>
        {
          inputErrors?.toAddress && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.toAddress} />
        }
      </Row>

      <Divider />

      <Row>
        <Col span={14}>
          <Text strong>{t("wallet_batchLock_startMonth")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <DatePicker value={dayjs(params.startLockMonth)} disabledDate={disabledDate} size="large" style={{ width: "100%" }} locale={locale} picker="month"
              onChange={(value) => {
                if (value) {
                  setParams({
                    ...params,
                    startLockMonth: DateFormat(value.toDate(), "yyyy-MM")
                  })
                }
              }} />
          </Space.Compact>
        </Col>
        <Col span={10}>
        </Col>
        {
          inputErrors?.startLockMonth && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.startLockMonth} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>{t("wallet_batchLock_periodMonth")}</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.periodMonth} onChange={(_input) => {
              const periodMonthInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                periodMonth: undefined
              })
              setParams({
                ...params,
                periodMonth: Number(periodMonthInputValue)
              })
            }} />
          </Space.Compact>
        </Col>
        <Col span={10}>
        </Col>
        {
          inputErrors?.periodMonth && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.periodMonth} />
        }
      </Row>

      <Row style={{ marginTop: "10px" }}>
        <BatchLockAert batchLockParams={params} />
      </Row>


      <Divider />
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
