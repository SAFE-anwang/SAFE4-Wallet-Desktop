import { Button, Col, Divider, Modal, Row, Typography } from "antd"
import { Safe4NetworkChainId, SafeswapV2RouterAddress, USDT, WSAFE } from "../../../config";
import TokenLogo from "../../components/TokenLogo";
import { ArrowDownOutlined, SwapLeftOutlined } from "@ant-design/icons";
import { Token, TokenAmount } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useContract, useSafeswapV2Router } from "../../../hooks/useContracts";
import { useTimestamp } from "../../../state/application/hooks";
import { ethers } from "ethers";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";


const { Text } = Typography;

export default ({
  openSwapConfirmModal, setOpenSwapConfirmModal,
  tokenA, tokenB,
  tokenInAmount, tokenOutAmount
}: {
  openSwapConfirmModal: boolean,
  setOpenSwapConfirmModal: (openSwapConfirmModal: boolean) => void,
  tokenA: undefined | Token,
  tokenB: undefined | Token,
  tokenInAmount: string,
  tokenOutAmount: string
}) => {

  const SwapV2RouterContract = useSafeswapV2Router(true);
  const timestamp = useTimestamp();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();

  const swap = () => {
    if (SwapV2RouterContract) {
      if (tokenA == undefined && tokenB) {
        const amountOutMin = ethers.utils.parseUnits(tokenOutAmount, tokenB.decimals);
        SwapV2RouterContract.swapExactETHForTokens(
          amountOutMin,
          [WSAFE[chainId as Safe4NetworkChainId].address, tokenB.address],
          activeAccount,
          timestamp + 100,
          { value: ethers.utils.parseEther(tokenInAmount) }
        ).then( (data:any) => {
          console.log("Hash ==" , data.hash)
        }).catch( (err:any) => {
          console.log("Swap Error =" ,err)
        } )
      }
    }
  }

  return <>
    <Modal title="互兑交易" footer={null} open={openSwapConfirmModal} destroyOnClose onCancel={() => setOpenSwapConfirmModal(false)} >
      <Divider />
      <Row>
        <Col span={3}>
          {
            tokenA ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={tokenA.address} chainId={tokenA.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text style={{ fontSize: "24px", lineHeight: "40px" }}>
            - {tokenInAmount} {tokenA ? tokenA.symbol : "SAFE"}
          </Text>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <ArrowDownOutlined style={{ fontSize: "24px", marginLeft: "7px", marginTop: "12px" }} />
        </Col>
      </Row>
      <Row style={{ marginTop: "10px" }}>
        <Col span={3}>
          {
            tokenB ? <>
              <ERC20TokenLogoComponent style={{ width: "40px", height: "40px", padding: "4px" }} address={tokenB.address} chainId={tokenB.chainId} />
            </> : <>
              <TokenLogo width="40px" height="40px" />
            </>
          }
        </Col>
        <Col span={21}>
          <Text type="success" style={{ fontSize: "24px", lineHeight: "40px" }}>
            + {tokenOutAmount} {tokenB ? tokenB.symbol : "SAFE"}
          </Text>
        </Col>
      </Row>
      <Divider />

      <Button onClick={swap}>Swap</Button>

    </Modal>
  </>

}
