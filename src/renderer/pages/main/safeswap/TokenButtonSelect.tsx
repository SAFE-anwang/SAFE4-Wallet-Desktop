import { DownOutlined } from "@ant-design/icons";
import { Token } from "@uniswap/sdk"
import { useWeb3React } from "@web3-react/core"
import { Button, Col, Row, Typography } from "antd";
import { useMemo, useState } from "react";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../components/TokenLogo";
import TokenSelectModal from "./TokenSelectModal";
import TokenSymbol from "../../components/TokenSymbol";

const { Text } = Typography;

export default ({
  token,
  tokenSelectCallback
}: {
  token: Token | undefined,
  tokenSelectCallback?: (token: Token | undefined) => void
}) => {
  const { chainId } = useWeb3React();
  const [openTokenSelectModal, setOpenTokenSelectModal] = useState<boolean>(false);

  const openSelectModal = () => {
    setOpenTokenSelectModal(true);
  };

  const RenderButton = useMemo(() => {
    if (token && chainId) {
      return <Button onClick={openSelectModal} style={{ height: "36px", width: "100%" }} size="small" type="text"
        icon={
          <ERC20TokenLogoComponent style={{
            padding: "2px", width: "36px", height: "36px", marginBottom: "4px"
          }} address={token.address} chainId={chainId} />
        }>
        <span style={{ display: "inline-block", lineHeight: "0px", height: "30px" }}>
          <Text style={{ fontSize: "12px", display: "block" }}>{TokenSymbol(token)}</Text><br />
          <Text style={{ fontSize: "8px", float: "right", display: "block" }} code>SRC20</Text>
        </span>
        <DownOutlined />
      </Button>
    } else {
      return <Button onClick={openSelectModal} style={{ height: "36px", width: "100%" }} size="small" type="text"
        icon={<TokenLogo width="34px" height="34px" />}>
        SAFE
        <DownOutlined />
      </Button>
    }
  }, [token, chainId])

  return <>
    {RenderButton}
    <TokenSelectModal selectedToken={token} openTokenSelectModal={openTokenSelectModal} setOpenTokenSelectModal={setOpenTokenSelectModal}
      tokenSelectCallback={tokenSelectCallback} />
  </>
}
