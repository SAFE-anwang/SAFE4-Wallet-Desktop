import { Alert, Avatar, Button, Col, Divider, Modal, Row, Spin, Typography } from "antd"
import useSRC20Prop from "../../../hooks/useSRC20Prop"
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useContract } from "../../../hooks/useContracts";
import { ISRC20_Interface } from "../../../abis";
import { ethers } from "ethers";
import EtherAmount from "../../../utils/EtherAmount";
import { CurrencyAmount } from "@uniswap/sdk";

const { Text } = Typography;

const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const showPngFromHex = (hexData: string) => {
  const byteArray = hexToUint8Array(hexData);
  const blob = new Blob([byteArray], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  return url;
};

export default ({
  openPromotionModal, setOpenPromotionModal,
  address
}: {
  openPromotionModal: boolean,
  setOpenPromotionModal: (openPromotionModal: boolean) => void,
  address: string
}) => {

  const { chainId } = useWeb3React();
  const { src20TokenProp, loading } = useSRC20Prop(address);
  const SRC20Contract = useContract(address, ISRC20_Interface, false);
  const [logoPayAmount, setLogoPayAmount] = useState<CurrencyAmount>();

  const [LOGO, setLOGO] = useState<{
    path: string,
    hex: string
  }>();

  const cancel = () => {
    setOpenPromotionModal(false);
  }

  const selectLOGOPicture = async () => {
    const [path, hex] = await window.electron.fileReader.selectFile();
    setLOGO({ path, hex })
  }

  useEffect(() => {
    if (SRC20Contract) {
      SRC20Contract.callStatic.getLogoPayAmount()
        .then(data => {
          setLogoPayAmount(CurrencyAmount.ether(data));
        })
    }
  }, [SRC20Contract])

  return <>
    <Modal open={openPromotionModal} footer={null} title="推广资产" destroyOnClose onCancel={cancel}>
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
        </Row>
      </Spin>
      <Divider />
      <Row>
        <Col span={24}>
          <Alert type="info" message={<>
            您可以支付 <Text strong>{logoPayAmount?.toSignificant()} SAFE</Text> ,来为您的资产设置LOGO,以便在钱包中更加清晰的显示您的资产.
          </>} />
        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          <Text type="secondary">资产LOGO</Text>

        </Col>
        <Col span={24} style={{ marginTop: "20px" }}>
          {
            chainId && <ERC20TokenLogoComponent address={address} chainId={chainId} />
          }
          {
            LOGO && <>
              <ArrowRightOutlined style={{ marginLeft: "10px", marginRight: "10px" }} />
              <Avatar src={`file://${LOGO.path}`} style={{ padding: "4px", width: "48px", height: "48px" }} />
            </>
          }
        </Col>
        {/* <Col span={24} style={{ marginTop: "20px" }}>
          {
            LOGO && <>
              <Avatar src={showPngFromHex(LOGO.hex)} style={{ padding: "4px", width: "48px", height: "48px" }} />
            </>
          }
        </Col> */}
        <Col span={24} style={{ marginTop: "30px" }}>
          <Button onClick={selectLOGOPicture}>选择图片</Button>
        </Col>
      </Row>
      <Divider />
    </Modal>
  </>

}
