import { useCallback, useMemo, useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
const { Text } = Typography;

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
    const gasLimit = 300000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);

  const [params, setParams] = useState<{
    lockDay: number,
    amount: string
  }>({
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

  const goNext = useCallback( () => {
    const { lockDay, amount } = params;
    if (!lockDay){
      inputErrors.lockDay = "请输入锁定天数";
    }
    if (!amount) {
      inputErrors.amount = "请输入锁仓数量";
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether( ethers.utils.parseEther(amount).toBigInt() );
        if ( _amount.greaterThan(maxBalance) ){
          inputErrors.amount = "锁定数量大于持有数量";
        }
        if ( !_amount.greaterThan(ZERO) ){
          inputErrors.amount = "请输入有效的数量";
        }
      } catch (error) {
        inputErrors.amount = "请输入正确的数量";
      }
    }
    if (lockDay) {
      try {
        const _lockDay = JSBI.BigInt(lockDay);
        if (JSBI.greaterThan( JSBI.BigInt(0) , _lockDay )){
          inputErrors.lockDay = "请输入正确的天数";
        }
      } catch (error) {
        inputErrors.lockDay = "请输入正确的天数";
      }
    }
    if ( inputErrors.amount || inputErrors.lockDay ){
      setInputErrors({...inputErrors})
      return;
    }
    goNextCallback( params );
   
  } , [activeAccount, maxBalance, params] );

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message="将账户中的SAFE锁仓到锁仓账户中,并在解锁高度后解锁." />
      <br />
      <Row >
        <Col span={14}>
          <Text strong>数量</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input  size="large" value={params.amount} onChange={(_input) => {
              const amountInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                amount:undefined
              })
              setParams({
                ...params,
                amount: amountInputValue
              })
            }} placeholder="输入数量" />
            <Button size="large" onClick={() => {
              setInputErrors({
                ...inputErrors,
                amount: undefined
              })
              setParams({
                ...params,
                amount: maxBalance.toFixed(18)
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
          inputErrors?.amount && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.amount} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>锁仓天数</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" onChange={(_input) => {
              const lockDayInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                lockDay:undefined
              })
              setParams({
                ...params,
                lockDay: Number(lockDayInputValue)
              })
            }} placeholder="输入锁仓天数" />
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
          }}>下一步</Button>
        </Col>
      </Row>
    </div>
  </>

}
