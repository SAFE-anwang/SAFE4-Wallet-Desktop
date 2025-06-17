import { Token, TokenAmount } from "@uniswap/sdk";
import { Alert, Col, Divider, Modal, Row, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import AddressComponent from "../../../../components/AddressComponent";
import { Contract } from "ethers";
import { IERC20_Interface } from "../../../../../abis";
import { SRC20_Template } from "../../../issue/SRC20_Template_Config";
import { useWeb3React } from "@web3-react/core";
import useSRC20Prop from "../../../../../hooks/useSRC20Prop";
import { QuestionCircleFilled, QuestionCircleOutlined } from "@ant-design/icons";

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
  const [src20Version, setSRC20Version] = useState<string>();

  const tokenSRC20Contract = useMemo(() => {
    return new Contract(token.address, SRC20_Template.SRC20.abi, provider);
  }, [token]);

  useEffect(() => {
    if (tokenSRC20Contract) {
      tokenSRC20Contract.callStatic.totalSupply().then((data: any) => {
        const totalSupplyAmount = new TokenAmount(token, data);
        setTotalSupplyAmount(totalSupplyAmount);
      })
      tokenSRC20Contract.callStatic.version().then((data: any) => {
        setSRC20Version(data);
      }).catch((err: any) => {
        console.log("Get Version Error:", err)
      })
    }
  }, [tokenSRC20Contract]);

  const { loading, src20TokenProp } = useSRC20Prop(token.address);

  const renderFeatureBySRC20Version = () => {
    if (!src20Version) {
      return <>
        <Text strong type="secondary">
          <QuestionCircleFilled color="#efefef" />
          未知
        </Text>
      </>
    }
    const pattern = /^SRC20(?:-(?<feature>[a-z]+(?:-[a-z]+)*))?-(?<version>\d+\.\d+\.\d+)$/;
    const match = src20Version.match(pattern);
    if (match) {
      const features = match.groups?.feature?.split('-') || [];
      const version = match.groups?.version;
      if (features.length == 0) {
        return <>
          <Text strong type="success">
            不可增发
          </Text>
        </>
      } else {
        const feature = features[0];
        if (feature == "mintable") {
          return <>
            <Text strong type="success">
              可增发
            </Text>
          </>
        } else if (feature == "burnable") {
          return <>
            <Text strong type="success">
              可增发/可销毁
            </Text>
          </>
        }
      }
    }
    return <>
      <Text strong type="secondary">
        <QuestionCircleFilled color="#efefef" />
        未知
      </Text>
    </>

  }

  return <Modal title="资产详情" footer={null} open={openViewTokenModal} onCancel={cancel} destroyOnClose >
    <Divider />
    <Row>
      <Col span={6} style={{ textAlign: "center" }}>
        <ERC20TokenLogoComponent style={{ width: "80px", height: "80px" }} chainId={token.chainId} address={token.address} />
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
      <Col span={24} style={{ marginBottom: "10px" }}>
        <Text type="secondary">合约地址</Text>
        <AddressComponent address={token.address} copyable qrcode />
      </Col>
      <Col span={12}>
        <Text type="secondary">供应量</Text>
        <br />
        <Text strong>{totalSupplyAmount?.toExact()} {token.symbol}</Text>
      </Col>
      <Col span={12} style={{ textAlign: "right" }}>
        <Text type="secondary">特性</Text>
        <br />
        {renderFeatureBySRC20Version()}
      </Col>
      <Divider />
    </Row>
    {
      src20TokenProp && <Row>
        {
          (src20TokenProp.description || src20TokenProp.officialUrl || src20TokenProp.whitePaperUrl || src20TokenProp.whitePaperUrl) &&
          <Col span={24}>
            <Alert type="warning" showIcon message={<>
              无论您是否信任该资产,请谨慎访问外部链接.
            </>} />
          </Col>
        }
        {
          src20TokenProp.description &&
          <Col span={24} style={{ marginTop: "15px" }}>
            <Text type="secondary">资产简介</Text>
            <br />
            <Text>{src20TokenProp.description}</Text>
          </Col>
        }
        {
          src20TokenProp.officialUrl &&
          <Col span={24} style={{ marginTop: "5px" }}>
            <Text type="secondary">官网</Text>
            <br />
            <Text>{src20TokenProp.officialUrl}</Text>
          </Col>
        }
        {
          src20TokenProp.whitePaperUrl &&
          <Col span={24} style={{ marginTop: "5px" }}>
            <Text type="secondary">白皮书</Text>
            <br />
            <Text>{src20TokenProp.whitePaperUrl}</Text>
          </Col>
        }
        {
          src20TokenProp.orgName &&
          <Col span={24} style={{ marginTop: "5px" }}>
            <Text type="secondary">组织机构</Text>
            <br />
            <Text>{src20TokenProp.orgName}</Text>
          </Col>
        }
      </Row>
    }

  </Modal>

}
