
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input, Radio, Space, InputNumber } from "antd";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from "react-router-dom";
import { DatePicker, GetProps } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { useCallback, useEffect, useState } from "react";
import { DateTimeFormat } from "../../../../utils/DateUtils";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import { useBlockNumber } from "../../../../state/application/hooks";
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveWallet } from "../../../../state/wallets/hooks";
import { SystemContract } from "../../../../constants/SystemContracts";
import { ONE, ZERO } from "../../../../utils/CurrentAmountUtils";
import CreateModalConfirm from "./CreateModal-Confirm";

const { Text, Title } = Typography;
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;
dayjs.extend(customParseFormat);
const { RangePicker } = DatePicker;

const InputRules = {
  title : {
    min : 8 ,
    max : 256
  },
  description : {
    min : 8,
    max : 2048
  },
  payTimes : {
    min : 1,
    max : 100
  }
}

export const enum PayType {
  ONETIME = "onetime",
  TIMES = "times"
}

// eslint-disable-next-line arrow-body-style
const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  return current && current < dayjs().endOf('day');
};

export default () => {

  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const balances = useETHBalances([SystemContract.Proposal, activeAccount]);
  const activeAccountBalance = balances[activeAccount];
  const proposalContractBalance = balances[SystemContract.Proposal];
  const [openCreateModal , setOpenCreateModal] = useState<boolean>(false);

  const [params, setParams] = useState<{
    payType: PayType,
    title?: string,
    description?: string,
    payAmount?: string,
    payTimes?: number,
    startPayTime?: number,
    endPayTime?: number
  }>({
    payType: PayType.ONETIME,
    payTimes: 2
  });
  const [inputErrors, setInputErrors] = useState<{
    title?: string,
    description?: string,
    payAmount?: string,
    payTimes?: string,
    payTime?: string,
    notEnough?: string
  }>({});

  const nextClick = useCallback(() => {
    const { title, description, payAmount, payTimes, startPayTime, endPayTime } = params;
    if (!title) inputErrors.title = "请输入提案的标题"
    if (!description) inputErrors.description = "请输入提案的描述"
    if (!payTimes) inputErrors.payTimes = "请输入分期付款次数"
    if (!startPayTime) inputErrors.payTime = "请选择付款日期"
    if (!endPayTime) inputErrors.payTime = "请选择付款日期"
    if (!payAmount) {
      inputErrors.payAmount = "请输入提案所需申请的SAFE数量"
    } else {

      if ( title && (title.length > InputRules.title.max || title.length < InputRules.title.min )){
        inputErrors.title = `标题长度需要大于${InputRules.title.min}且小于${InputRules.title.max}`;
      }
      if ( description && (description.length > InputRules.description.max || description.length < InputRules.description.min )){
        inputErrors.description = `描述长度需要大于${InputRules.description.min}且小于${InputRules.description.max}`;
      }
      if ( payTimes && payTimes > InputRules.payTimes.max ){
        inputErrors.payTimes = `分期次数不能超过${InputRules.payTimes.max}`;
      }
      try {
        const _payAmount = CurrencyAmount.ether(ethers.utils.parseEther(payAmount).toBigInt());
        if (!_payAmount.greaterThan(ZERO)) {
          inputErrors.payAmount = "输入有效的SAFE数量"
        }
        if (proposalContractBalance && _payAmount.greaterThan(proposalContractBalance)) {
          inputErrors.payAmount = "申请的SAFE数量不能大于提案资金池内的SAFE数量"
        }
      } catch (err) {
        inputErrors.payAmount = "输入正确的SAFE数量"
      }
    }
    if (inputErrors.title || inputErrors.description || inputErrors.payAmount
      || inputErrors.payTimes || inputErrors.payTime) {
      setInputErrors({
        ...inputErrors
      })
      return;
    }
    if (activeAccountBalance) {
      if (!activeAccountBalance.greaterThan(ONE)) {
        setInputErrors({
          ...inputErrors,
          notEnough: "没有足够的SAFE来支付创建提案的费用!"
        })
        return;
      }
      // GO next..
      setOpenCreateModal(true);
    }

  }, [params, activeAccountBalance, proposalContractBalance]);

  useEffect(() => {
    setInputErrors({
      ...inputErrors,
      notEnough: undefined
    })
  }, [activeAccount])

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/proposals")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          创建提案
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>
          <Row>
            <Col span={24}>
              <Text type='secondary'>标题</Text><br />
              <Input status={inputErrors.title ? "error" : ""} value={params.title} placeholder="输入提案的标题" onChange={(event) => {
                setParams({
                  ...params,
                  title: event.target.value
                })
                setInputErrors({
                  ...inputErrors,
                  title: undefined
                })
              }} />
              {
                inputErrors.title &&
                <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                  {inputErrors.title}
                </>} />
              }
            </Col>
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <Text type='secondary'>描述</Text><br />
              <Input.TextArea status={inputErrors.description ? "error" : ""} value={params.description} onChange={(event) => {
                setParams({
                  ...params,
                  description: event.target.value
                })
                setInputErrors({
                  ...inputErrors,
                  description: undefined
                })
              }} placeholder="输入提案的描述" />
              {
                inputErrors.description &&
                <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                  {inputErrors.description}
                </>} />
              }
            </Col>
          </Row>
          <Divider />
          <Row>
            <Col span={12}>
              <Text type='secondary'>申请SAFE数量</Text><br />
              <Input status={inputErrors.payAmount ? "error" : ""} value={params.payAmount} onChange={(event) => {
                setParams({
                  ...params,
                  payAmount: event.target.value
                })
                setInputErrors({
                  ...inputErrors,
                  payAmount: undefined
                })
              }} placeholder="输入SAFE数量" />
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type='secondary'>提案资金池余额</Text><br />
              <Text type='secondary'>{proposalContractBalance?.toFixed(2)} SAFE</Text><br />
            </Col>
            {
              inputErrors.payAmount &&
              <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                {inputErrors.payAmount}
              </>} />
            }
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <Text type='secondary'>发放方式</Text><br />
              <Radio.Group value={params.payType} onChange={(payType) => {
                setParams({
                  ...params,
                  payType: payType.target.value,
                  startPayTime : undefined,
                  endPayTime : undefined
                })
              }}>
                <Space direction="horizontal">
                  <Radio value={PayType.ONETIME}>一次</Radio>
                  <Radio value={PayType.TIMES}>分期</Radio>
                </Space>
              </Radio.Group>
            </Col>
            <Col style={{ marginTop: "10px" }} span={24}>
              <Text type='secondary'>发放时间</Text><br />
              {
                params.payType == PayType.ONETIME && <>
                  <DatePicker locale={locale} showNow={false} status={inputErrors.payTime ? "error" : ""}
                    format="YYYY-MM-DD HH:mm:ss"
                    disabledDate={disabledDate}
                    showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
                    onChange={(value) => {
                      if (value) {
                        setParams({
                          ...params,
                          startPayTime: value?.toDate().valueOf(),
                          endPayTime: value?.toDate().valueOf()
                        })
                        setInputErrors({
                          ...inputErrors,
                          payTime: undefined
                        })
                      }
                    }}
                  />
                  {
                    inputErrors.payTime &&
                    <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                      {inputErrors.payTime}
                    </>} />
                  }
                </>
              }
              {
                params.payType == PayType.TIMES &&
                <>
                  <RangePicker status={inputErrors.payTime ? "error" : ""}
                    locale={locale}
                    disabledDate={disabledDate}
                    showTime={{
                      hideDisabledOptions: true,
                      defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('11:59:59', 'HH:mm:ss')],
                    }}
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={(times) => {
                      if (times) {
                        setParams({
                          ...params,
                          startPayTime: times[0]?.toDate().valueOf(),
                          endPayTime: times[1]?.toDate().valueOf()
                        })
                        setInputErrors({
                          ...inputErrors,
                          payTime: undefined
                        })
                      }
                    }}
                  />
                  {
                    inputErrors.payTime &&
                    <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                      {inputErrors.payTime}
                    </>} />
                  }
                  <br />
                  <Text style={{ marginTop: "5px" }} type='secondary'>分期次数</Text><br />
                  <InputNumber min={2} status={inputErrors.payTimes ? "error" : ""} value={params.payTimes} onChange={(num) => {
                    if (num) {
                      setParams({
                        ...params,
                        payTimes: num
                      })
                      setInputErrors({
                        ...inputErrors,
                        payTimes: undefined
                      })
                    }
                  }} style={{ width: "100px" }} />
                  {
                    inputErrors.payTimes &&
                    <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                      {inputErrors.payTimes}
                    </>} />
                  }
                </>
              }
            </Col>
          </Row>
          <Divider />
          {
            inputErrors.notEnough &&
            <>
              <Row>
                <Col span={18}>
                  <Alert style={{ marginTop: "5px" }} type="error" showIcon message={<>
                    {inputErrors.notEnough}
                  </>} />
                </Col>
                <Col span={6} style={{ textAlign: "right" }}>
                  <Text type='secondary'>当前账户余额</Text><br />
                  <Text type='secondary'>{activeAccountBalance?.toFixed(2)} SAFE</Text><br />
                </Col>
              </Row>
              <Divider />
            </>
          }
          <Row style={{ width: "100%", textAlign: "right" }}>
            <Col span={24}>
              <Button type="primary" onClick={() => {
                nextClick();
              }}>下一步</Button>
            </Col>
          </Row>
        </div>
      </Card>
    </Row>

    <CreateModalConfirm openCreateModal={openCreateModal} setOpenCreateModal={setOpenCreateModal} createParams={ {...params} } />

  </>
}
