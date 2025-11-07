import { ArrowDownOutlined, DownOutlined, LeftOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Spin, Typography } from "antd";
import { useTranslation } from "react-i18next";
import ERC20TokenLogoComponent from "../../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Safe4NetworkChainId, USDT } from "../../../../config";
import { useETHBalances, useTokenBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import TokenLogo from "../../../components/TokenLogo";
import { getNetworkLogo, NetworkType, outputNetworkCoin } from "../../../../assets/logo/NetworkLogo";
import { ZERO, ONE } from "../../../../utils/CurrentAmountUtils";
import { CurrencyAmount, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import CrosschainConfirmModal from "./CrosschainConfirmModal";
import { fetchCrosschainConfig } from "../../../../services/crosschain";

const { Title, Text, Link } = Typography;

const { Option } = Select;

export default () => {

  const { t } = useTranslation();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const [openCrosschainConfirmModal, setOpenCrosschainConfirmModal] = useState(false);

  const SAFE_SUPPORT_TARGET_CHAIN: NetworkType[] = [
    NetworkType.BSC, NetworkType.ETH, NetworkType.MATIC
  ];
  const USDT_SUPPORT_TARGET_CHAIN: NetworkType[] = [
    NetworkType.BSC, NetworkType.ETH,
    // NetworkType.SOL, NetworkType.TRX
  ];
  const Token_USDT = chainId && USDT[chainId as Safe4NetworkChainId];
  const tokenUSDTBalance = Token_USDT && useTokenBalances(activeAccount, [Token_USDT])[Token_USDT.address];

  const [inputParams, setInputParams] = useState<{
    token: string,
    targetNetwork: NetworkType,
    amount: string,
    targetAddress: string,
  }>({
    token: "SAFE",
    targetNetwork: NetworkType.BSC,
    amount: "0.0",
    targetAddress: activeAccount
  });

  useEffect(() => {
    setInputParams({
      ...inputParams,
      amount: "0.0",
      targetAddress: activeAccount
    });
    setInputErrors({});
    setInputWarnings({});
  }, [activeAccount]);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{
    minamount: string,
    safe2eth: boolean,
    safe2bsc: boolean,
    safe2matic: boolean | undefined,
    safe2trx: boolean | undefined,
    safe2sol: boolean | undefined
  }>();

  const [fetchCrosschainConfigError, setFetchCrosschainConfigError] = useState<string>();
  useEffect(() => {
    if (chainId) {
      setLoading(true);
      fetchCrosschainConfig(chainId, inputParams.token).then((data) => {
        setFetchCrosschainConfigError(undefined);
        setLoading(false);
        setConfig({
          minamount: data.minamount,
          safe2eth: data.eth.safe2eth,
          safe2bsc: data.bsc.safe2bsc,
          safe2matic: data.matic?.safe2matic,
          safe2trx: data.trx?.safe2trx,
          safe2sol: data.sol?.safe2sol
        });
        console.log(data)
      }).catch((err: any) => {
        console.log("Error ==>", err)
        setFetchCrosschainConfigError("跨链网关无法访问,请检查本地网络,或者稍后再试.");
      })
    }
  }, [chainId, inputParams.token]);

  const selectTokenOptions = () => {
    return <Select defaultValue="SAFE" bordered={false} onChange={(selectToken) => {
      setInputParams({
        ...inputParams,
        token: selectToken,
        targetNetwork: NetworkType.BSC,
        amount: "0.0"
      })
    }}>
      <Option value="SAFE">
        <TokenLogo />
        <Text style={{ marginLeft: "5px" }} strong>SAFE</Text>
      </Option>
      {
        chainId && Token_USDT &&
        <Option key={Token_USDT.address} value={Token_USDT.symbol}>
          <ERC20TokenLogoComponent style={{ width: "30px", height: "30px" }} chainId={chainId} address={Token_USDT.address} />
          <Text style={{ marginLeft: "5px" }} strong>{Token_USDT.symbol}</Text>
        </Option>
      }
    </Select>
  };

  const targetNetworkSelect = () => {
    const token = inputParams.token;
    if (token) {
      let targetNetworkTypes: NetworkType[] = [];
      if (token == 'SAFE') {
        targetNetworkTypes = SAFE_SUPPORT_TARGET_CHAIN;
      } else if (token == 'USDT') {
        targetNetworkTypes = USDT_SUPPORT_TARGET_CHAIN;
      }
      return <Select style={{ float: "right" }} value={inputParams.targetNetwork} bordered={false}
        onChange={(selectNetworkType) => {
          setInputErrors({
            ...inputErrors,
            targetNetwork: undefined
          })
          setInputParams({
            ...inputParams,
            targetNetwork: selectNetworkType
          })
        }}>
        {
          targetNetworkTypes.map(networkType => {
            let configIndex = "safe2" + outputNetworkCoin(networkType);
            let disabled = config && config[configIndex as keyof typeof config] ? false : true;
            return <Option key={networkType} value={networkType} disabled={disabled}>
              <Avatar src={getNetworkLogo(networkType)} style={{ width: "40px", height: "40px" }} />
              {
                disabled &&
                <Text type="secondary" style={{ marginLeft: "5px" }} strong>{networkType}</Text>
              }
              {
                !disabled &&
                <Text style={{ marginLeft: "5px" }} strong>{networkType}</Text>
              }

            </Option>
          })
        }
      </Select>
    }
    return <></>
  };

  const tokenBalance = useMemo(() => {
    if (inputParams.token == 'USDT' && tokenUSDTBalance) {
      return tokenUSDTBalance;
    } else {
      return activeAccountETHBalance;
    }
  }, [activeAccountETHBalance, tokenUSDTBalance, inputParams.token]);

  const maxBalance = useMemo(() => {
    if (inputParams.token == 'USDT') {
      return tokenBalance;
    } else {
      const minKeepBalance = CurrencyAmount.ether(ethers.utils.parseEther("0.0001").toBigInt());
      return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(minKeepBalance))
        ? activeAccountETHBalance.subtract(minKeepBalance) : ZERO;
    }
  }, [tokenBalance, inputParams.token]);

  const maxBalanceClick = useMemo(() => {
    return () => {
      if (maxBalance) {
        setInputParams({
          ...inputParams,
          amount: maxBalance.toExact()
        });
        setInputErrors({
          ...inputErrors,
          amount: undefined
        })
      }
    }
  }, [inputParams.token, maxBalance]);

  const [inputErrors, setInputErrors] = useState<{
    amount?: string,
    targetAddress?: string,
    targetNetwork?: string
  }>({});
  const [inputWarning, setInputWarnings] = useState<{
    targetAddress?: string,
    targetNetwork?: string
  }>();

  const goNext = useCallback(() => {
    const { token, amount, targetAddress, targetNetwork } = inputParams;
    if (!amount) {
      inputErrors.amount = t("please_enter") + t("wallet_send_amount");
    } else {
      if (config) {
        try {
          CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
          if (chainId && maxBalance) {
            let _amount = undefined;
            let _minAmount = undefined;
            if (token == 'SAFE') {
              _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
              _minAmount = CurrencyAmount.ether(ethers.utils.parseEther(config.minamount.toString()).toBigInt());
              if (_minAmount.greaterThan(_amount)) {
                inputErrors.amount = t("wallet_crosschain_ltminamount");
              }
            } else if (token == 'USDT' && Token_USDT) {
              _amount = new TokenAmount(Token_USDT, ethers.utils.parseUnits(amount, Token_USDT.decimals).toBigInt());
              _minAmount = new TokenAmount(Token_USDT, ethers.utils.parseUnits(config.minamount.toString(), Token_USDT.decimals).toBigInt());
              if (_minAmount.greaterThan(_amount)) {
                inputErrors.amount = t("wallet_crosschain_ltminamount");
              }
            }
            if (_amount) {
              if (_amount.greaterThan(maxBalance)) {
                inputErrors.amount = t("wallet_send_amountgeavaiable");
              }
              if (!_amount.greaterThan(ZERO)) {
                inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
              }
            } else {
              inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
            }
          }
        } catch (error) {
          console.log("Error =", error)
          inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
        }
      }
      if (!targetAddress) {
        inputErrors.targetAddress = t("wallet_send_entercorrectwalletaddress");
      }
      // 网关判断是否开启;
      switch (targetNetwork) {
        case NetworkType.BSC:
          if (!config?.safe2bsc) {
            inputErrors.targetNetwork = t("wallet_crosschain_serverclose");
          }
          break;
        case NetworkType.ETH:
          if (!config?.safe2eth) {
            inputErrors.targetNetwork = t("wallet_crosschain_serverclose");
          }
          break;
        case NetworkType.MATIC:
          if (!config?.safe2matic) {
            inputErrors.targetNetwork = t("wallet_crosschain_serverclose");
          }
          break;
        case NetworkType.TRX:
          if (!config?.safe2bsc) {
            inputErrors.targetNetwork = t("wallet_crosschain_serverclose");
          }
          break;
        case NetworkType.SOL:
          if (!config?.safe2bsc) {
            inputErrors.targetNetwork = t("wallet_crosschain_serverclose");
          }
          break;
      }
      if (inputErrors.amount || inputErrors.targetAddress || inputErrors.targetNetwork) {
        setInputErrors({
          ...inputErrors
        })
        return;
      }
      setOpenCrosschainConfirmModal(true);
    }
  }, [inputParams, chainId, maxBalance, inputErrors, Token_USDT, config])

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_crosschain")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                {t("wallet_crosschain_tip")}
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          <Card style={{ width: "50%", margin: "auto" }}>
            {
              fetchCrosschainConfigError && <Row style={{ marginBottom: "20px" }}>
                <Col span={24}>
                  <Alert type="warning" showIcon message={fetchCrosschainConfigError} />
                </Col>
              </Row>
            }
            <Spin spinning={loading}>
              <Row>
                <Col span={24}>
                  <Text type="secondary" strong>{t("wallet_crosschain_select_token")}</Text>
                  {
                    tokenBalance && <Text style={{ float: "right" }} type="secondary">{t("balance_currentavailable")}:{tokenBalance.toFixed(2)}</Text>
                  }
                </Col>
                <Col span={16}>
                  <Input value={inputParams.amount} size="large" style={{ height: "80px", width: "150%", fontSize: "24px" }}
                    onChange={(event) => {
                      setInputParams({
                        ...inputParams,
                        amount: event.target.value
                      });
                      setInputErrors({
                        ...inputErrors,
                        amount: undefined
                      })
                    }} />
                </Col>
                <Col span={8}>
                  <Row style={{ marginTop: "24px" }}>
                    <Col span={8}>
                      <div style={{ marginTop: "4px" }}>
                        <Link onClick={maxBalanceClick}>{t("wallet_send_max")}</Link>
                        <Divider type="vertical" />
                      </div>
                    </Col>
                    <Col span={16}>
                      {selectTokenOptions()}
                    </Col>
                  </Row>
                </Col>
                {
                  inputErrors.amount &&
                  <Col span={24}>
                    <Alert showIcon style={{ marginTop: "5px" }} type="error" message={<>
                      {inputErrors.amount}
                    </>} />
                  </Col>
                }
              </Row>
              <Row>
                <Col span={24}>
                  <ArrowDownOutlined style={{ fontSize: "24px", color: "green", marginTop: "10px", marginBottom: "10px" }} />
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Text type="secondary" strong>{t("wallet_crosschain_select_network")}</Text>
                </Col>
                <Col span={16}>
                  <Input readOnly size="large" style={{ height: "80px", width: "150%", background: "#efefef" }} />
                </Col>
                <Col span={8}>
                  <Row style={{ marginTop: "24px" }}>
                    <Col span={24}>
                      {targetNetworkSelect()}
                    </Col>
                  </Row>
                </Col>
                {
                  inputErrors.targetNetwork && <Col span={24}>
                    <Alert style={{ marginTop: "5px" }} showIcon type="error" message={inputErrors.targetNetwork} />
                  </Col>
                }
              </Row>
              <Row style={{ marginTop: "20px" }}>
                <Col span={24}>
                  <Text type="secondary" strong>{t("wallet_crosschain_target_address")}</Text>
                </Col>
                <Col span={16}>
                  <Input onChange={(event) => {
                    const inputAddress = event.target.value;
                    setInputParams({
                      ...inputParams,
                      targetAddress: inputAddress.trim()
                    });
                    setInputErrors({
                      ...inputErrors,
                      targetAddress: undefined
                    })
                    setInputWarnings({
                      ...inputWarning,
                      targetAddress: undefined
                    })
                    if (!ethers.utils.isAddress(inputAddress)) {
                      setInputErrors({
                        ...inputErrors,
                        targetAddress: t("wallet_send_entercorrectwalletaddress")
                      })
                    } else {
                      if (inputAddress != activeAccount) {
                        setInputWarnings({
                          ...inputWarning,
                          targetAddress: t("wallet_crosschain_target_address_warning")
                        })
                      }
                    }

                  }} value={inputParams.targetAddress} size="large" style={{ width: "150%", }} />
                </Col>
                {
                  inputWarning?.targetAddress &&
                  <Col span={24}>
                    <Alert showIcon style={{ marginTop: "5px" }} type="warning" message={<>
                      {inputWarning?.targetAddress}
                    </>} />
                  </Col>
                }
                {
                  inputErrors?.targetAddress &&
                  <Col span={24}>
                    <Alert showIcon style={{ marginTop: "5px" }} type="error" message={<>
                      {inputErrors?.targetAddress}
                    </>} />
                  </Col>
                }
              </Row>
              <Divider></Divider>
              <Row>
                <Col span={24}>
                  <Button type="primary" style={{ float: "right" }} onClick={goNext}>{t("next")}</Button>
                </Col>
              </Row>
            </Spin>
          </Card>
        </Card>
      </div>
    </div>
    {
      openCrosschainConfirmModal &&
      <CrosschainConfirmModal {...inputParams} openCrosschainConfirmModal={openCrosschainConfirmModal} setOpenCrosschainConfirmModal={setOpenCrosschainConfirmModal} />
    }
  </>
}
