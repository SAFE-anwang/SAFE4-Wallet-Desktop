import { Token, TokenAmount } from "@uniswap/sdk";
import { Col, Divider, Modal, Row, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import AddressComponent from "../../../../components/AddressComponent";
import { Contract } from "ethers";
import { IERC20_Interface } from "../../../../../abis";
import { SRC20_Template } from "../../../issue/SRC20_Template_Config";
import { useWeb3React } from "@web3-react/core";

const { Text } = Typography;

export default ({
  token,
  openViewTokenModal,
  setOpenViewTokenModal
}: {
  token: Token,
  openViewTokenModal: boolean,
  setOpenViewTokenModal: (openViewTokenModal: boolean) => void
}) => {

  const cancel = () => {
    setOpenViewTokenModal(false);
  }
  const { provider } = useWeb3React();
  const [totalSupplyAmount, setTotalSupplyAmount] = useState<TokenAmount>();
  const [src20Version, setSRC20Version ] = useState<string>();

  const tokenSRC20Contract = useMemo( () => {
    return new Contract(token.address, SRC20_Template.SRC20.abi, provider);
  } , [token] )

  useEffect(() => {
    if (tokenSRC20Contract) {
      tokenSRC20Contract.callStatic.totalSupply().then((data: any) => {
        const totalSupplyAmount = new TokenAmount(token, data);
        setTotalSupplyAmount(totalSupplyAmount);
      })
      tokenSRC20Contract.callStatic.version().then((data: any) => {
        console.log("version ::", data)
      }).catch((err: any) => {
        console.log("Get Version Error:", err)
      })
    }
  }, [tokenSRC20Contract]);

  return <Modal title="资产详情" footer={null} open={openViewTokenModal} onCancel={cancel} destroyOnClose >
    <Divider />
    <Row>
      <Col span={6} style={{ textAlign: "center" }}>
        <ERC20TokenLogoComponent style={{ width: "100px", height: "100px" }} chainId={token.chainId} address={token.address} />
      </Col>
      <Col span={18}>
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Text type="secondary">资产名称</Text>
            <br />
            <Text strong>{token.name}</Text>
          </Col>
          <Col span={24} style={{ textAlign: "right" }}>
            <Text type="secondary">资产符号</Text>
            <br />
            <Text strong>{token.symbol}</Text>
          </Col>
        </Row>
      </Col>
      <Divider />
      <Col span={24}>
        <Text type="secondary">合约地址</Text>
        <AddressComponent address={token.address} copyable qrcode />
      </Col>
      <Col span={24}>
        <Text type="secondary">供应量</Text>
        <br />
        <Text strong>{totalSupplyAmount?.toExact()} {token.symbol}</Text>
      </Col>
      <Divider />
    </Row>
    <Row>
      <Col span={24}>
        {JSON.stringify(token)}
      </Col>
    </Row>
  </Modal>

}
