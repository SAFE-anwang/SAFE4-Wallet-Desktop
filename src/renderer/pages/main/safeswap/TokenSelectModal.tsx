import { Button, Card, Col, Row, Typography, Flex, Avatar, Divider, Modal } from "antd"
import { ERC20_LOGO, SAFE_LOGO, USDT_LOGO } from "../../../assets/logo/AssetsLogo";
import TokenLogo from "../../components/TokenLogo";
import { useTokenBalances, useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { Token } from "@uniswap/sdk";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import TokenSymbol from "../../components/TokenSymbol";
import { useWeb3React } from "@web3-react/core";
import { Safe4NetworkChainId, USDT } from "../../../config";
import { useSafeswapWalletTokens } from "./hooks";
import { useMarketTokenPrices } from "../../../state/audit/hooks";
import { TokenPriceVO } from "../../../services";


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
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const tokens = useSafeswapWalletTokens(true);
  const tokenAmounts = useTokenBalances(activeAccount, tokens);
  const tokenPrices = useMarketTokenPrices();
  const tokenPricesMap = tokenPrices?.reduce((map, tokenPrice) => {
    map[tokenPrice.address] = tokenPrice;
    return map;
  }, {} as { [address: string]: TokenPriceVO });

  const onTokenClick = (token: Token | undefined) => {
    setOpenTokenSelectModal(false);
    tokenSelectCallback && tokenSelectCallback(token);
  }

  return <>
    <Modal style={{ overflowY: 'auto' }} width={600} open={openTokenSelectModal} footer={null} destroyOnClose onCancel={() => setOpenTokenSelectModal(false)}>
      <Row>
        <Col span={24}>
          <Text>基础通证</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Flex gap="small">
            <Button disabled={selectedToken == undefined} onClick={() => onTokenClick(undefined)} style={{ height: "40px" }} type="default" icon={<TokenLogo />} >
              SAFE
            </Button>
            {/* {
              chainId && <Button disabled={selectedToken == USDT[chainId as Safe4NetworkChainId]}
                onClick={() => onTokenClick(USDT[chainId as Safe4NetworkChainId])} style={{ height: "40px" }} type="default" icon={
                  <Avatar src={USDT_LOGO} />
                }>
                USDT
              </Button>
            } */}
          </Flex>
        </Col>
        <Divider />
        <Col span={24}>
          <Text>通证名称</Text>
        </Col>
        <Col span={24} style={{ maxHeight: "500px", overflowY: "auto" }}>
          {
            tokens && <Card className="menu-item-container" style={{ width: "100%", marginBottom: "20px", marginTop: "5px" }}>
              {
                tokens.map((erc20Token, index) => {
                  const { address, name, symbol, chainId } = erc20Token;
                  let price = undefined;
                  let change = "";
                  let trend = 0;
                  const priceStr = tokenPricesMap && tokenPricesMap[address] && tokenPricesMap[address].price;
                  const changeStr = tokenPricesMap && tokenPricesMap[address] && tokenPricesMap[address].change;
                  if (priceStr) {
                    price = parseFloat(priceStr).toFixed(4);
                  }
                  if (changeStr) {
                    let changeValue = parseFloat(changeStr);
                    trend = changeValue == 0 ? 0 : changeValue > 0 ? 1 : -1;
                    change = (parseFloat(changeStr) * 100).toFixed(2) + "%";
                  }
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
                          <Col span={14} style={{ lineHeight: price ? "30px" : "" }}>
                            <Text style={{ fontSize: "14px" }} strong>
                              {TokenSymbol(erc20Token)}
                            </Text>
                            <Text code style={{ fontSize: "10px" }}>SRC20</Text>
                            {
                              price && <>
                                <br />
                                <Text type={trend > 0 ? "success" : trend < 0 ? "danger" : "secondary"} strong>
                                  ${price}
                                </Text>
                                <Text type={trend > 0 ? "success" : trend < 0 ? "danger" : "secondary"}>
                                  {price && <> ({trend == 1 && "+"}{change})</>}
                                </Text>
                              </>
                            }
                          </Col>
                          <Col span={10} style={{ lineHeight: "60px", textAlign: "right" }}>
                            <Text strong style={{ marginRight: "20px" }}>{tokenAmounts && tokenAmounts[address]?.toSignificant()}</Text>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </>
                })
              }
            </Card>
          }
        </Col>

      </Row>
    </Modal>
  </>

}
