import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ethers } from "ethers";
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import AddressView from "../../../components/AddressView";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";

const { Text } = Typography;

const ZERO = CurrencyAmount.ether(JSBI.BigInt(0));
export default ({
  goNextCallback
}: {
  goNextCallback: (inputParams: {
    to: string,
    amount: string
  }) => void
}) => {

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
    amount: string
  }>({
    to: "",
    amount: ""
  });

  const [inputErrors, setInputErrors] = useState<{
    to: string | undefined,
    amount: string | undefined
  }>({
    to: undefined,
    amount: undefined
  });

  const goNext = useCallback(() => {
    const { to, amount } = params;
    if (!to || !ethers.utils.isAddress(to)) {
      inputErrors.to = "请输入正确的钱包地址";
    }
    if (!amount) {
      inputErrors.amount = "请输入发送数量";
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether( ethers.utils.parseEther(amount).toBigInt() );
        if ( _amount.greaterThan(maxBalance) ){
          inputErrors.amount = "转出数量大于持有数量";
        }
      } catch (error) {
        inputErrors.amount = "请输入正确的数量";
      }
    }
    if (inputErrors.to || inputErrors.amount) {
      setInputErrors({ ...inputErrors })
      return;
    }
    goNextCallback(params);
  }, [activeAccount, maxBalance, params]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message="将账户中的SAFE发送到指定钱包地址" />
      <br />
      <Row >
        <Col span={24}>
          <Text strong>从</Text>
          <br />
          <Text style={{ fontSize: "18px" }}>
            <AddressView address={activeAccount}></AddressView>
          </Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>到</Text>
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
          }} placeholder="输入到账地址"></Input>
        </Col>
        {
          inputErrors?.to && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.to} />
        }
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>数量</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" value={params.amount} onChange={(_input) => {
              const toInputValue = _input.target.value;
              setInputErrors({
                ...inputErrors,
                amount:undefined
              })
              setParams({
                ...params,
                amount: toInputValue
              })
            }} placeholder="输入数量" />
            <Button size="large" onClick={() => {
              setInputErrors({
                ...inputErrors,
                amount:undefined
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

      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={goNext}>下一步</Button>
        </Col>
      </Row>

    </div>
  </>

}
