import { Card } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useMemo, useState } from "react";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ethers } from "ethers";
import { ONE, ZERO } from "../../../../utils/CurrentAmountUtils";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Alert } from "antd"
import { SupernodeInfo } from "../../../../structs/Supernode";
import InputVoteModalConfirm from "./ InputVoteModal-Confirm";

const { Text } = Typography;

export default ({
  supernodeInfo, supernodeAddresses
}: {
  supernodeInfo?: SupernodeInfo,
  supernodeAddresses: string[]
}) => {

  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const maxBalance = useMemo(() => {
    const gasPrice = JSBI.BigInt(ethers.utils.parseEther("0.00000000001").toString());
    const gasLimit = 500000;
    const gasPay = CurrencyAmount.ether(
      JSBI.multiply(gasPrice, JSBI.BigInt(gasLimit))
    );
    return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(gasPay))
      ? activeAccountETHBalance.subtract(gasPay) : ZERO;
  }, [activeAccountETHBalance]);

  const [openVoteModal, setOpenVoteModal] = useState<boolean>(false);

  const [params, setParams] = useState<{
    amount: string
  }>({
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    amount: string | undefined
  }>({
    amount: undefined
  });

  const onClickVote = () => {
    const { amount } = params;
    if (!amount) {
      inputErrors.amount = "请输入用于投票的SAFE数量";
    }
    if (amount) {
      try {
        let _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
        if (_amount.greaterThan(maxBalance)) {
          inputErrors.amount = "用于投票的SAFE数量大于持有数量";
        }
        if ( ONE.greaterThan(_amount)) {
          inputErrors.amount = "必须大于 1 SAFE";
        }
      } catch (error) {
        inputErrors.amount = "请输入正确的数量";
      }
    }
    if (inputErrors.amount) {
      setInputErrors({ ...inputErrors })
      return;
    }
    setOpenVoteModal(true);
  }

  return <>
    <Card title="使用账户中的SAFE余额进行投票">
      <Alert style={{marginBottom:"20px"}} showIcon message={<>
        用于投票的SAFE将会在锁仓账户中创建一个新的锁仓记录
      </>}/>
      <Row >
        <Col span={14}>
          <Text strong>数量</Text>
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
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button disabled={params.amount?false:true} type="primary" style={{ float: "left" }} onClick={() => {
            onClickVote()
          }}>投票</Button>
        </Col>
      </Row>
    </Card>
    {
      supernodeInfo && <InputVoteModalConfirm openVoteModal={openVoteModal} setOpenVoteModal={setOpenVoteModal}
        supernodeInfo={supernodeInfo} amount={params.amount}/>
    }
  </>
}
