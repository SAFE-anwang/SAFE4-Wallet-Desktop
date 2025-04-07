import { DownOutlined } from "@ant-design/icons";
import { Token } from "@uniswap/sdk"
import { useWeb3React } from "@web3-react/core"
import { Button } from "antd";
import { useMemo, useState } from "react";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenLogo from "../../components/TokenLogo";
import TokenSelectModal from "./TokenSelectModal";


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
        icon={<ERC20TokenLogoComponent style={{
          padding: "2px", width: "36px", height: "36px"
        }} address={token.address} chainId={chainId} />}>
        {token.symbol}
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
