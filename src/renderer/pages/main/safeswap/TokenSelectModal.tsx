import { Button, Card, Col, Row, Typography, Flex, Avatar, Divider, Modal } from "antd"
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../../assets/logo/AssetsLogo";
import TokenLogo from "../../components/TokenLogo";
import { useTokens } from "../../../state/transactions/hooks";
import { useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import { Token } from "@uniswap/sdk";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";

const { Text } = Typography;


export default ({
  openTokenSelectModal,
  setOpenTokenSelectModal,
  tokenSelectCallback,
  selectedToken,
}: {
  openTokenSelectModal: boolean,
  setOpenTokenSelectModal: (openTokenSelectModal: boolean) => void,
  tokenSelectCallback?: (token: Token | undefined) => void,
  selectedToken?: Token | undefined
}) => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const tokens = useTokens();
  const [erc20Tokens, setERC20Tokens] = useState<Token[]>([]);
  const tokenAmounts = useTokenBalances(activeAccount, erc20Tokens);

  const onTokenClick = (token: Token | undefined) => {
    setOpenTokenSelectModal(false);
    tokenSelectCallback && tokenSelectCallback(token);
  }

  useEffect(() => {
    if (tokens && chainId) {
      const defaultTokenAddresses: { [address: string]: Token } = {};
      defaultTokenAddresses[USDT[chainId as Safe4NetworkChainId].address] = USDT[chainId as Safe4NetworkChainId];
      defaultTokenAddresses[WSAFE[chainId as Safe4NetworkChainId].address] = WSAFE[chainId as Safe4NetworkChainId];
      const defaultTokens = Object.keys(defaultTokenAddresses).map(address => defaultTokenAddresses[address]);
      const erc20Tokens = Object.keys(tokens)
        .filter(address => {
          return tokens[address].chainId == chainId
            && tokens[address].name != "Safeswap V2"
            && defaultTokenAddresses[address] == undefined
        })
        .map(address => {
          const { name, symbol, decimals, chainId } = tokens[address];
          const token = new Token(
            chainId,
            address, decimals,
            symbol, name
          );
          return token;
        });
      setERC20Tokens(defaultTokens.concat(erc20Tokens));
    }
  }, [tokens, chainId]);

  return <>
    <Modal style={{}} open={openTokenSelectModal} footer={null} destroyOnClose onCancel={() => setOpenTokenSelectModal(false)}>
      <Row>
        <Col span={24}>
          <Text>基础通证</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Flex gap="small">
            <Button disabled={selectedToken == undefined} onClick={() => onTokenClick(undefined)} style={{ height: "40px" }} type="default" icon={<TokenLogo />} >
              SAFE
            </Button>
            {
              chainId && <Button disabled={selectedToken == USDT[chainId as Safe4NetworkChainId]}
                onClick={() => onTokenClick(USDT[chainId as Safe4NetworkChainId])} style={{ height: "40px" }} type="default" icon={
                  <Avatar src={USDT_LOGO} />
                }>
                USDT
              </Button>
            }

          </Flex>
        </Col>
        <Divider />
        <Col span={24}>
          <Text>通证名称</Text>
        </Col>
        {
          erc20Tokens && <Card className="menu-item-container" style={{ width: "100%", marginBottom: "20px", marginTop: "5px" }}>
            {
              erc20Tokens.map((erc20Token, index) => {
                const { address, name, symbol, chainId } = erc20Token;
                return <>
                  {
                    index > 0 && <>
                      <Divider style={{ margin: "0px 0px" }} />
                    </>
                  }
                  <Row onClick={() => {
                    if (erc20Token != selectedToken) {
                      setOpenTokenSelectModal(false);
                      tokenSelectCallback && tokenSelectCallback(erc20Token);
                    }
                  }} className='menu-item' style={{ height: "60px", lineHeight: "60px", background: selectedToken && selectedToken.address == erc20Token.address ? "#efefef" : "" }}>
                    <Col span={4} style={{ textAlign: "center" }}>
                      <ERC20TokenLogoComponent chainId={chainId} address={address} />
                    </Col>
                    <Col span={20}>
                      <Row>
                        <Col span={10} style={{ lineHeight: "60px" }}>
                          <Text strong>{symbol}</Text>
                        </Col>
                        <Col span={14} style={{ lineHeight: "60px", textAlign: "right" }}>
                          <Text strong style={{ marginRight: "20px" }}>{tokenAmounts && tokenAmounts[address]?.toExact()} </Text>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </>
              })
            }
          </Card>
        }
      </Row>
    </Modal>
  </>

}
