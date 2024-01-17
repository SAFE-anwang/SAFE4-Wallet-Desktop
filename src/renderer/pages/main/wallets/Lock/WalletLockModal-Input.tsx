import { useState } from "react";
import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
const { Text } = Typography;

export default ({
  finishCallback
}: {
  finishCallback: ( {} : {
    amount : string,
    lockDay : number
  } ) => void
}) => {

  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];

  const [params, setParams] = useState<{
    lockDay: number,
    amount: string
  }>({
    lockDay: 0,
    amount: ""
  });

  return <>
    <div style={{ minHeight: "300px" }}>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>数量</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" onChange={(_input) => {
              const amountInputValue = _input.target.value;
              setParams({
                ...params,
                amount: amountInputValue
              })
            }} placeholder="输入数量" />
            <Button size="large">最大</Button>
          </Space.Compact>
        </Col>
        <Col span={10}>
          <Text style={{ float: "right" }} strong>可用数量</Text>
          <br />
          <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
            {activeAccountETHBalance?.toFixed(6)}
          </Text>
        </Col>
      </Row>
      <br />
      <Row >
        <Col span={14}>
          <Text strong>锁仓天数</Text>
          <br />
          <Space.Compact style={{ width: '100%' }}>
            <Input size="large" onChange={(_input) => {
              const lockDayInputValue = _input.target.value;
              setParams({
                ...params,
                lockDay: Number(lockDayInputValue)
              })
            }} placeholder="输入锁仓天数" />
          </Space.Compact>
        </Col>
      </Row>

      <br />
      <br />
      <br />
      <br />
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button type="primary" style={{ float: "right" }} onClick={() => {
            finishCallback(params)
          }}>下一步</Button>
        </Col>
      </Row>
    </div>
  </>

}
