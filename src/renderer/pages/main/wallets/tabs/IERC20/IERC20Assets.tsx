import { Avatar, Button, Card, Col, Divider, Row, Typography } from "antd"
import { RightOutlined, WalletOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";
import { useTokenBalances, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TokenSendModal from "./TokenSendModal";
import { useTokens } from "../../../../../state/transactions/hooks";
import TokenAddModal from "./TokenAddModal";
import { ERC20_LOGO, SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import AddressView from "../../../../components/AddressView";
import AddressComponent from "../../../../components/AddressComponent";
import { useWeb3React } from "@web3-react/core";
import { useTranslation } from "react-i18next";
import { Safe4_Network_Config } from "../../../../../config";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
const { Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const [erc20Tokens, setERC20Tokens] = useState<Token[]>([]);
  const activeAccount = useWalletsActiveAccount();
  const [openTokenSendModal, setOpenTokenSendModal] = useState(false);
  const [openTokenAddModal, setOpenTokenAddModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>();
  const tokens = useTokens();
  const tokenAmounts = useTokenBalances(activeAccount, erc20Tokens);

  useEffect(() => {
    if (tokens) {
      const defaultTokenAddresses : { [ address : string ] : Token } = {};
      if ( chainId == Safe4_Network_Config.Testnet.chainId ){
        defaultTokenAddresses[ Safe4_Network_Config.Testnet.WSAFE.address ] = Safe4_Network_Config.Testnet.WSAFE;
        defaultTokenAddresses[ Safe4_Network_Config.Testnet.USDT.address ] = Safe4_Network_Config.Testnet.USDT;
      } else {

      }
      const defaultTokens = Object.keys( defaultTokenAddresses ).map( address => defaultTokenAddresses[address]  );
      const erc20Tokens = Object.keys(tokens)
        .filter(address => {
          return tokens[address].chainId == chainId
          && tokens[address].name != "Safeswap V2"
          && defaultTokenAddresses[address] == undefined
        })
        .map(address => {
          const { name, symbol, decimals } = tokens[address];
          const token = new Token(
            ChainId.MAINNET,
            address, decimals,
            symbol, name
          );
          return token;
        });

      setERC20Tokens( defaultTokens.concat(erc20Tokens) );
    }
  }, [tokens, chainId]);


  return <>
    <Row>
      <Col span={24}>
        <Button onClick={() => { setOpenTokenAddModal(true) }} type="primary" icon={<AppstoreAddOutlined />}>{t("add")}</Button>
      </Col>
    </Row>

    {
      erc20Tokens && <Card className="menu-item-container" style={{ marginBottom: "20px", marginTop: "20px" }}>
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
                setSelectedToken(erc20Token);
                setOpenTokenSendModal(true);
              }} className='menu-item' style={{ height: "80px", lineHeight: "80px" }}>
                <Col span={2} style={{ textAlign: "center" }}>
                  <ERC20TokenLogoComponent chainId={chainId} address={address} />
                </Col>
                <Col span={10}>
                  <Row>
                    <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                      <Text strong>{name}</Text>
                    </Col>
                    <Col span={24} style={{ lineHeight: "35px" }}>
                      <Text strong>{tokenAmounts && tokenAmounts[address]?.toExact()} </Text>
                      <Text type="secondary">{symbol}</Text>
                    </Col>
                  </Row>
                </Col>
                <Col span={12} style={{ paddingRight: "30px", paddingTop: "5px" }}>
                  <Row>
                    <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                      <Text style={{ float: "right" }} type="secondary">{t("wallet_tokens_contract")}</Text>
                    </Col>
                    <Col span={24} style={{ lineHeight: "35px" }}>
                      <Text style={{ float: "right", marginTop: "10px" }}>
                        <AddressComponent address={address} copyable qrcode />
                      </Text>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </>
          })
        }
      </Card>
    }

    {
      selectedToken &&
      <TokenSendModal token={selectedToken} openSendModal={openTokenSendModal} setOpenSendModal={setOpenTokenSendModal} />
    }

    <TokenAddModal openTokenAddModal={openTokenAddModal} setOpenTokenAddModal={setOpenTokenAddModal} />

  </>

}
