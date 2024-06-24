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
import { formatEther } from "ethers/lib/utils";

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
  periodMonth: number
}

export function BatchLockAert({
  batchLockParams
}: {
  batchLockParams: BatchLockParams
}) {
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
          自 <Text strong>{startLockMonth}</Text> 开始,
          每间隔 <Text strong>{periodMonth}</Text> 个月,
          每次解锁 <Text strong>{_perLockAmount} </Text> SAFE
        </Text>
      </Col>
      <Col span={24}>
        <Text>
          共解锁 <Text strong>{lockTimes}</Text> 次,
          合计解锁 <Text strong>{_totalLockAmount} </Text> SAFE
        </Text>
      </Col>
    </Row>
  </>}></Alert>
}


export default ({
  goNextCallback
}: {
  goNextCallback: ({}:BatchLockParams) => void
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

  const [params, setParams] = useState<BatchLockParams>({
    perLockAmount: "",
    lockTimes: 36,
    startLockMonth: GetNextMonth(),
    periodMonth: 1
  });
  const [inputErrors, setInputErrors] = useState<{
    lockTimes: string | undefined,
    perLockAmount: string | undefined,
    startLockMonth: string | undefined,
    periodMonth: string | undefined,
  }>({
    lockTimes: undefined,
    perLockAmount: undefined,
    startLockMonth: undefined,
    periodMonth: undefined,
  });
  const [totalLockAmount, setTotalLockAmount] = useState<string>("0");

  const goNext = useCallback(() => {

    const { perLockAmount, lockTimes, startLockMonth, periodMonth } = params;

    if (!perLockAmount) {
      inputErrors.perLockAmount = "请输入每次锁仓数量";
    }
    if (!lockTimes || !(lockTimes > 0)) {
      inputErrors.lockTimes = "请输入合计锁仓次数";
    }
    if (!startLockMonth) {
      inputErrors.lockTimes = "请选择锁仓起始月份";
    }
    if (!periodMonth || !(periodMonth > 0)) {
      inputErrors.periodMonth = "请输入锁仓间隔月份";
    }
    if (perLockAmount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(perLockAmount).toBigInt());
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.perLockAmount = "请输入有效的数量";
        }
      } catch (error) {
        inputErrors.perLockAmount = "请输入正确的数量";
      }
    }
    if (inputErrors.perLockAmount || inputErrors.lockTimes || inputErrors.startLockMonth || inputErrors.periodMonth) {
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
            }} placeholder="输入合计锁仓次数" />
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
          <Text strong>锁仓总数量</Text>
          <br />
          <Text strong style={{ float: "left", fontSize: "18px", lineHeight: "36px" }}>
            {totalLockAmount} SAFE
          </Text>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>可用数量</Text>
          <br />
          <Text type="secondary" style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
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

      <Row style={{ marginTop: "10px" }}>
        <BatchLockAert batchLockParams={params} />
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
