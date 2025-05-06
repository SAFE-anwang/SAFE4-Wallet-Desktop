import { Avatar, Button, Card, Col, Divider, Row, Typography } from "antd"
import { RightOutlined, WalletOutlined, AppstoreAddOutlined, StopOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { ChainId, Token, TokenAmount } from "@uniswap/sdk";
import { useTokenBalances, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import TokenSendModal from "./TokenSendModal";
import { useWalletTokens } from "../../../../../state/transactions/hooks";
import TokenAddModal from "./TokenAddModal";
import AddressComponent from "../../../../components/AddressComponent";
import { useTranslation } from "react-i18next";
import ERC20TokenLogoComponent from "../../../../components/ERC20TokenLogoComponent";
import { useAuditTokenList } from "../../../../../state/audit/hooks";
import TokenName from "../../../../components/TokenName";
import TokenSymbol from "../../../../components/TokenSymbol";
import TokenAddModalAndTokenList from "./TokenAddModalAndTokenList";
import { IPC_CHANNEL, Safe4NetworkChainId, USDT, WSAFE } from "../../../../../config";
import { useDispatch } from "react-redux";
import { removeERC20Token } from "../../../../../state/transactions/actions";
import { ERC20Tokens_Methods, ERC20TokensSignal } from "../../../../../../main/handlers/ERC20TokenSignalHandler";
const { Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const [openTokenSendModal, setOpenTokenSendModal] = useState(false);
  const [openTokenAddModal, setOpenTokenAddModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>();

  const dispatch = useDispatch();
  const auditTokens = useAuditTokenList();
  const walletTokens = useWalletTokens();
  const tokenAmounts = useTokenBalances(activeAccount, walletTokens);
  const tokens = useMemo(() => {
    const tokens = walletTokens && walletTokens.filter(token => {
      return token.name != 'Safeswap V2'
    });
    if (auditTokens) {
      const auditMap = auditTokens.reduce((map, token) => {
        map[token.address] = token;
        return map;
      }, {} as { [address: string]: any })
      return tokens?.filter(token => auditMap[token.address] != undefined)
    }
    return tokens;
  }, [walletTokens, auditTokens]);

  const disalbeHide = (address: string) => {
    if (address.toLocaleLowerCase() == WSAFE[Safe4NetworkChainId.Testnet].address.toLocaleLowerCase()
      || address.toLocaleLowerCase() == WSAFE[Safe4NetworkChainId.Mainnet].address.toLocaleLowerCase()
      || address.toLocaleLowerCase() == USDT[Safe4NetworkChainId.Testnet].address.toLocaleLowerCase()
      || address.toLocaleLowerCase() == USDT[Safe4NetworkChainId.Mainnet].address.toLocaleLowerCase()) {
      return true;
    }
    return false;
  }

  const removeToken = (address: string, chainId: number) => {
    dispatch(removeERC20Token({ chainId, address }));
    window.electron.ipcRenderer.sendMessage(
      IPC_CHANNEL, [ERC20TokensSignal, ERC20Tokens_Methods.remove, [{
        chainId, address
      }]]
    );
  }

  return <>
    <Row>
      <Col span={24}>
        <Button onClick={() => { setOpenTokenAddModal(true) }} type="primary" icon={<AppstoreAddOutlined />}>{t("add")}</Button>
      </Col>
    </Row>
    {
      tokens && <Card className="menu-item-container" style={{ marginBottom: "20px", marginTop: "20px" }}>
        {
          tokens.map((erc20Token, index) => {
            const { address, name, symbol, chainId } = erc20Token;
            return <>
              {
                index > 0 && <>
                  <Divider style={{ margin: "0px 0px" }} />
                </>
              }
              <Row className='menu-item' style={{ height: "80px", lineHeight: "80px" }}>
                <Col onClick={() => {
                  setSelectedToken(erc20Token);
                  setOpenTokenSendModal(true);
                }} span={2} style={{ textAlign: "center" }}>
                  <ERC20TokenLogoComponent chainId={chainId} address={address} />
                </Col>
                <Col onClick={() => {
                  setSelectedToken(erc20Token);
                  setOpenTokenSendModal(true);
                }} span={10}>
                  <Row>
                    <Col span={24} style={{ lineHeight: "35px", marginTop: "5px" }}>
                      <Text strong>{TokenName(erc20Token)}</Text>
                      <Text style={{ fontSize: "14px", marginLeft: "2px" }} code>SRC20</Text>
                    </Col>
                    <Col span={24} style={{ lineHeight: "35px" }}>
                      <Text strong>{tokenAmounts && tokenAmounts[address]?.toFixed(6)} </Text>
                      <Text type="secondary">{TokenSymbol(erc20Token)}</Text>
                    </Col>
                  </Row>
                </Col>
                <Col span={10} style={{ paddingRight: "30px", paddingTop: "5px" }}>
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
                <Col span={2}>
                  <Button onClick={() => removeToken(address, chainId)} disabled={disalbeHide(address)} icon={<StopOutlined />}>
                    隐藏
                  </Button>
                </Col>
              </Row>
            </>
          })
        }
      </Card>
    }
    {
      selectedToken && openTokenSendModal &&
      <TokenSendModal token={selectedToken} openSendModal={openTokenSendModal} setOpenSendModal={setOpenTokenSendModal} />
    }
    <TokenAddModalAndTokenList openTokenAddModal={openTokenAddModal} setOpenTokenAddModal={setOpenTokenAddModal} />
  </>

}
