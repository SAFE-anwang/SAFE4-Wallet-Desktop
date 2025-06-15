import { Token, TokenAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Col, Divider, Input, Modal, Row, Spin, Typography } from "antd"
import { useMemo, useState } from "react";
import useSRC20Prop from "../../../hooks/useSRC20Prop";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";

const { Text } = Typography;

export default ({ openMintModal, setOpenMintModal, address }: {
  openMintModal: boolean,
  setOpenMintModal: (openMintModal: boolean) => void,
  address: string
}) => {

  const cancel = () => {
    setOpenMintModal(false);
  }
  const { src20TokenProp, loading } = useSRC20Prop(address);
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();

  const [inputParams, setInputParams] = useState<{
    toAddress: string,
    amount: string
  }>({
    toAddress: activeAccount,
    amount: ""
  });
  const [inputErrors, setInputErrors] = useState<{
    toAddress?: string,
    amount?: string
  }>({
    toAddress: undefined,
    amount: undefined
  });



  const { token, totalSupply } = useMemo(() => {
    if (chainId && src20TokenProp) {
      const token = new Token(chainId, address, src20TokenProp.decimals, src20TokenProp.symbol, src20TokenProp.name);
      const totalSupply = new TokenAmount(token, src20TokenProp.totalSupply.toBigInt());
      return {
        token,
        totalSupply
      }
    }
    return {};
  }, [chainId, src20TokenProp]);

  return <Modal width={800} open={openMintModal} footer={null} title="增发资产" destroyOnClose onCancel={() => cancel()}>
    <Divider />
    <Spin spinning={loading}>
      <Row>
        <Col span={12}>
          <Text type="secondary">资产名称</Text>
          <br />
          <Text strong>{src20TokenProp?.name}</Text>
        </Col>
        <Col span={12}>
          <Text type="secondary">资产符号</Text>
          <br />
          <Text strong>{src20TokenProp?.symbol}</Text>
        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          <Text type="secondary">总供应量</Text>
          <br />
          {
            totalSupply && <>
              <Text strong>
                {totalSupply.toExact()} {token.symbol}
              </Text>
            </>
          }
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">增发地址</Text>
        </Col>
        <Col span={24}>
          <Input value={inputParams.toAddress} style={{ width: "50%" }} onChange={ () => {
            
          } }></Input>
          {
            inputErrors.toAddress && <Alert style={{marginTop:"5px"}} type="error" showIcon message={<>
              {inputErrors.toAddress}
            </>} />
          }
        </Col>
        <Col span={24}>
          <Text type="secondary">增发数量</Text>
        </Col>
        <Col span={24}>
          <Input value={inputParams.amount} style={{ width: "50%" }}></Input>
        </Col>
      </Row>
      <Divider />
    </Spin>

  </Modal>

}
