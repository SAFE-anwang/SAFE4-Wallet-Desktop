import { Avatar, Col, Divider, Row, Typography } from "antd";
import { Safe4_Network_Config } from "../../config";
import TokenLogo from "./TokenLogo";
import { BSC_NETWORK_LOGO, ETH_NETWORK_LOGO } from "../../assets/logo/NetworkLogo";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useDAppBlockchainRpcProps } from "../../state/dApp/hooks";

const { Text } = Typography

export type Size = 'normal' | 'small';

export default ({
  chainId,
  size
}: {
  chainId: number | string,
  size?: Size
}) => {
  // 修复：将传入的 chainId 统一转换为数字
  const _chainId = typeof chainId === 'string' && chainId.startsWith('0x')
    ? Number(chainId)
    : Number(chainId);
  const dAppBlockchainRpcProps = useDAppBlockchainRpcProps();

  const outputForNormal = (chainId: number) => {
    switch (chainId) {
      case 1:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <Avatar style={{ width: "60px", height: "60px" }} src={ETH_NETWORK_LOGO} />
            <br />
            <Text strong>{dAppBlockchainRpcProps[chainId].chainName}</Text><br />
          </div>
        </>
      case 56:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <Avatar style={{ width: "60px", height: "60px" }} src={BSC_NETWORK_LOGO} />
            <br />
            <Text strong>{dAppBlockchainRpcProps[chainId].chainName}</Text><br />
          </div>
        </>
      case Safe4_Network_Config.Mainnet.chainId:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <TokenLogo width={"60px"} height={"60px"} />
            <br />
            <Text strong>Safe4(主网)</Text><br />
          </div>
        </>
      case Safe4_Network_Config.Testnet.chainId:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <TokenLogo width={"60px"} height={"60px"} />
            <br />
            <Text type="secondary" strong>Safe4(测试网)</Text><br />
          </div>
        </>
      default:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <QuestionCircleOutlined style={{ fontSize: "60px", color: "#b6abab" }} />
            <br />
            <Text type="secondary" strong>不支持的区块链网络:{_chainId}</Text><br />
          </div>
        </>
    }
  }

  const outputForSmallSize = (chainId: number) => {
    switch (chainId) {
      case 1:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <Avatar style={{ width: "28px", height: "28px" }} src={ETH_NETWORK_LOGO} />
            <Divider type="vertical" />
            <Text strong>{dAppBlockchainRpcProps[chainId].chainName}</Text><br />
          </div>
        </>
      case 56:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <Avatar style={{ width: "28px", height: "28px" }} src={BSC_NETWORK_LOGO} />
            <Divider type="vertical" />
            <Text strong>{dAppBlockchainRpcProps[chainId].chainName}</Text><br />
          </div>
        </>
      case Safe4_Network_Config.Mainnet.chainId:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>

            <TokenLogo width={"24px"} height={"24px"} />
            <Divider type="vertical" />
            <Text strong>Safe4(主网)</Text><br />
          </div>
        </>
      case Safe4_Network_Config.Testnet.chainId:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <TokenLogo width={"24px"} height={"24px"} />
            <Divider type="vertical" />
            <Text type="secondary" strong>Safe4(测试网)</Text>
          </div>
        </>
      default:
        return <>
          <div style={{ width: "100%", textAlign: "center" }}>
            <QuestionCircleOutlined style={{ fontSize: "24px", color: "#b6abab" }} />
            <Divider type="vertical" />
            <Text type="secondary" strong>未支持的网络:{_chainId}</Text>
          </div>
        </>
    }
  }

  const output = (chainId: number) => {
    if (size && size == 'small') {
      return outputForSmallSize(chainId)
    } else {
      return outputForNormal(chainId);
    }
  }

  return <>
    {output(_chainId)}
  </>
}
