import { Avatar, Button, Card, Col, Divider, Row, Typography } from "antd"
import { RightOutlined, WalletOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import SAFE_LOGO from "../../../../../assets/logo/SAFE.png";
import { useEffect, useState } from "react";
import { IPC_CHANNEL } from "../../../../../config";
import { ERC20Tokens_Methods, ERC20TokenSignalHandler, ERC20TokensSignal } from "../../../../../../main/handlers/ERC20TokenSignalHandler";
import { useWeb3React } from "@web3-react/core";
import { useMultipleContractSingleData } from "../../../../../state/multicall/hooks";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";
import { useTokenBalances, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TokenSendModal from "./TokenSendModal";
const { Text } = Typography;

export default () => {

  const { chainId } = useWeb3React();
  const [erc20Tokens, setERC20Tokens] = useState<Token[]>([]);
  const activeAccount = useWalletsActiveAccount();
  const [openTokenSendModal, setOpenTokenSendModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>();

  useEffect(() => {
    if (chainId) {
      const method = ERC20Tokens_Methods.getAll;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ERC20TokensSignal, method, [chainId]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ERC20TokensSignal && arg[1] == method) {
          const data = arg[2][0];
          const erc20Tokens = data.map((erc20Token: any) => {
            const { address, name, symbol, decims } = erc20Token;
            const token = new Token(
              ChainId.MAINNET, address, decims, symbol, name
            );
            return token;
          })
          setERC20Tokens(erc20Tokens);
        }
      });
    }
  }, [chainId]);

  const tokenAmounts = useTokenBalances(activeAccount, erc20Tokens);

  return <>
    <Row>
      <Col span={24}>
        <Button type="primary" icon={<AppstoreAddOutlined />}>添加</Button>
      </Col>
    </Row>
    <Card className="menu-item-container" style={{ marginBottom: "20px", marginTop: "20px" }}>
      {
        erc20Tokens.map((erc20Token, index) => {
          const { address, name, symbol } = erc20Token;
          return <>
            {
              index > 0 && <>
                <Divider style={{ margin: "0px 0px" }} />
              </>
            }
            <Row onClick={() => {
              setSelectedToken(erc20Token);
              setOpenTokenSendModal(true);
            }} className='menu-item' style={{ height: "80px", lineHeight: "80px" }}>
              <Col span={2} style={{ textAlign: "center" }}>
                <Avatar src={SAFE_LOGO} style={{ width: "48px", height: "48px" }} />
              </Col>
              <Col span={20}>
                <Row>
                  <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                    <Text strong>{name}</Text>
                  </Col>
                  <Col span={24} style={{ lineHeight: "35px" }}>
                    <Text strong>{tokenAmounts && tokenAmounts[address]?.toFixed(2)} </Text>
                    <Text type="secondary">{symbol}</Text>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        })
      }
    </Card>

    {
      selectedToken &&
      <TokenSendModal token={selectedToken} openSendModal={openTokenSendModal} setOpenSendModal={setOpenTokenSendModal} />
    }

  </>

}
