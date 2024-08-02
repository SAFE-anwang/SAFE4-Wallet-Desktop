import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert, Switch } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ethers } from "ethers";
import { CurrencyAmount, JSBI, Token, TokenAmount } from "@uniswap/sdk";
import { useETHBalances, useTokenBalance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import AddressView from "../../../../components/AddressView";

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
      inputErrors.to = "请输入正确的钱包地址";
    }
    if (!amount) {
      inputErrors.amount = "请输入发送数量";
    }
    if (amount) {
      try {
        let _amount = new TokenAmount( token , ethers.utils.parseEther(amount).toBigInt() );
        if (!_amount.greaterThan(ZERO)) {
          inputErrors.amount = "请输入正确的数量";
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
  }, [activeAccount, activeAccountTokenAmount, params ]);

  return <>
    <div style={{ minHeight: "300px" }}>
      <Alert showIcon type="info" message={`将账户中的代币 ${token.symbol} 发送到指定钱包地址`} />
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
                amount: undefined
              })
              setParams({
                ...params,
                amount: toInputValue
              })
            }} placeholder="输入数量" />
            {
              activeAccountTokenAmount &&
              <Button size="large" onClick={() => {
                setInputErrors({
                  ...inputErrors,
                  amount: undefined
                })
                setParams({
                  ...params,
                  amount: activeAccountTokenAmount.toFixed( token.decimals )
                })
              }}>最大</Button>
            }
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>可用数量</Text>
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
          <Button type="primary" style={{ float: "right" }} onClick={goNext}>下一步</Button>
        </Col>
      </Row>
    </div>
  </>

}
