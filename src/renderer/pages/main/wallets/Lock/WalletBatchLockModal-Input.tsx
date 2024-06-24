import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import type { DatePickerProps } from 'antd';
import { DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { DateFormat, GetNextMonth } from "../../../../utils/DateUtils";

const { Text } = Typography;

// eslint-disable-next-line arrow-body-style
const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf('month');
};

const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));
export default ({
  goNextCallback
}: {
  goNextCallback: ({ }: {
    amount: string,
    lockDay: number
  }) => void
}) => {

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

  const [params, setParams] = useState<{
    totalLockAmount: string | undefined,
    perLockAmount: string | undefined,
    startLockMonth: string,
    periodMonth: number
  }>({
    totalLockAmount: undefined,
    perLockAmount: undefined,
    startLockMonth: GetNextMonth(),
    periodMonth: 1
  });
  const [inputErrors, setInputErrors] = useState<{
    totalLockAmount: string | undefined,
    perLockAmount: string | undefined,
    startLockMonth: string | undefined,
    periodMonth: string | undefined,
  }>({
    totalLockAmount: undefined,
    perLockAmount: undefined,
    startLockMonth: undefined,
    periodMonth: undefined,
  });

  const goNext = useCallback(() => {

  }, [activeAccount, maxBalance, params]);

  useEffect(() => {
    const DEFAULT_MONTHS = 12;
    const { totalLockAmount, perLockAmount } = params;
    if (totalLockAmount && !perLockAmount) {
      //
      const JSBI_TotalLockAmount = JSBI.BigInt(
        ethers.utils.parseEther(totalLockAmount)
      )
      const JSBI_PerLockAmount = JSBI.divide(JSBI_TotalLockAmount, JSBI.BigInt(DEFAULT_MONTHS));
      console.log("PerLockAmount ==", JSBI_PerLockAmount.toString());
    }
    if (!totalLockAmount && perLockAmount) {
      console.log("try to acculate totalLockAmount")
    }
    if (totalLockAmount && perLockAmount) {

    }
  }, [params]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <br />

      <Row >
        <Col span={14}>
          <Text strong>每次锁仓数量</Text>
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
            }} placeholder="输入每次锁仓数量" />
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
          <Text strong>合计锁仓次数</Text>
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
            }} placeholder="输入每次锁仓数量" />
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
          <Text strong>锁仓总数量</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.totalLockAmount} onChange={(_input) => {
              const totalLockAmountInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                totalLockAmount: undefined
              })
              setParams({
                ...params,
                totalLockAmount: totalLockAmountInputValue
              })
            }} placeholder="输入数量" />
            <Button size="large" onClick={() => {
              setInputErrors({
                ...inputErrors,
                totalLockAmount: undefined
              })
              setParams({
                ...params,
                totalLockAmount: maxBalance.toFixed(18)
              })
            }}>最大</Button>
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>可用数量</Text>
          <br />
          <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
        {
          inputErrors?.totalLockAmount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.totalLockAmount} />
        }
      </Row>

      <Divider />

      <Row >
        <Col span={14}>
          <Text strong>锁仓起始月份</Text>
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
          <Text strong>锁仓间隔月份</Text>
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
            }} placeholder="输入锁仓天数" />
          </Space.Compact>
        </Col>
        <Col span={10}>
        </Col>
        {
          inputErrors?.periodMonth && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.periodMonth} />
        }
      </Row>
      <Divider />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={() => {
            goNext();
          }}>下一步</Button>
        </Col>
      </Row>
    </div>
  </>

}
