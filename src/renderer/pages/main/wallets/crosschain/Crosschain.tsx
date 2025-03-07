import { ArrowDownOutlined, DownOutlined, LeftOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Input, MenuProps, message, Row, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ERC20TokenLogoComponent from "../../../components/ERC20TokenLogoComponent";
import { useWeb3React } from "@web3-react/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Safe4_Network_Config } from "../../../../config";
import { useETHBalances, useTokenBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import TokenLogo from "../../../components/TokenLogo";
import { getNetworkLogo, NetworkType } from "../../../../assets/logo/NetworkLogo";
import { ZERO, ONE } from "../../../../utils/CurrentAmountUtils";
import { CurrencyAmount, TokenAmount } from "@uniswap/sdk";
import { ethers } from "ethers";
import CrosschainConfirmModal from "./CrosschainConfirmModal";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../../state/application/action";

const { Title, Text, Link } = Typography;

const { Option } = Select;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];
  const [openCrosschainConfirmModal, setOpenCrosschainConfirmModal] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const dispatch = useDispatch();

  const cancel = useCallback(() => {
    setOpenCrosschainConfirmModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  const SAFE_SUPPORT_TARGET_CHAIN: NetworkType[] = [
    NetworkType.BSC, NetworkType.ETH, NetworkType.MATIC
  ];
  const USDT_SUPPORT_TARGET_CHAIN: NetworkType[] = [
    NetworkType.BSC, NetworkType.ETH, NetworkType.SOL, NetworkType.TRX
  ];

  const tokenUSDT = useMemo(() => {
    if (chainId && chainId == Safe4_Network_Config.Testnet.chainId) {
      return Safe4_Network_Config.Testnet.USDT;
    } else {
      return Safe4_Network_Config.Mainnet.USDT;
    }
  }, [chainId]);
  const tokenUSDTBalance = useTokenBalances(activeAccount, [tokenUSDT])[tokenUSDT.address];

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

  const selectTokenOptions = useMemo(() => {
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
        chainId &&
        <Option key={tokenUSDT.address} value={tokenUSDT.name}>
          <ERC20TokenLogoComponent style={{ width: "30px", height: "30px" }} chainId={chainId} address={tokenUSDT.address} />
          <Text style={{ marginLeft: "5px" }} strong>{tokenUSDT.name}</Text>
        </Option>
      }
    </Select>
  }, [chainId, tokenUSDT]);

  const targetNetworkSelect = useMemo(() => {
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
          setInputParams({
            ...inputParams,
            targetNetwork: selectNetworkType
          })
        }}>
        {
          targetNetworkTypes.map(networkType => {
            return <Option key={networkType} value={networkType}>
              <Avatar src={getNetworkLogo(networkType)} style={{ width: "40px", height: "40px" }} />
              <Text style={{ marginLeft: "5px" }} strong>{networkType}</Text>
            </Option>
          })
        }
      </Select>
    }
  }, [inputParams]);

  const tokenBalance = useMemo(() => {
    if (activeAccountETHBalance && tokenUSDTBalance) {
      if (inputParams.token == 'USDT') {
        return tokenUSDTBalance;
      } else {
        return activeAccountETHBalance;
      }
    }
    return ZERO;
  }, [activeAccountETHBalance, tokenUSDTBalance, inputParams.token]);
  const maxBalance = useMemo(() => {
    if (inputParams.token == 'USDT') {
      return tokenBalance;
    } else {
      return (activeAccountETHBalance && activeAccountETHBalance.greaterThan(ZERO) && activeAccountETHBalance.greaterThan(ONE))
        ? activeAccountETHBalance.subtract(ONE) : ZERO;
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
    targetAddress?: string
  }>({});
  const [inputWarning, setInputWarnings] = useState<{
    targetAddress?: string
  }>();

  const goNext = useCallback(() => {
    const { token, amount, targetAddress } = inputParams;
    if (!amount) {
      inputErrors.amount = t("please_enter") + t("wallet_send_amount");
    } else {
      try {
        CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
        if (chainId && maxBalance) {
          let _amount = undefined;
          if (token == 'SAFE') {
            _amount = CurrencyAmount.ether(ethers.utils.parseEther(amount).toBigInt());
          } else if (token == 'USDT') {
            const USDT_TOKEN = chainId == Safe4_Network_Config.Mainnet.chainId ?
              Safe4_Network_Config.Mainnet.USDT
              : Safe4_Network_Config.Testnet.USDT
            _amount = new TokenAmount(USDT_TOKEN, ethers.utils.parseUnits(amount, USDT_TOKEN.decimals).toBigInt());
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
        inputErrors.amount = t("enter_correct") + t("wallet_send_amount");
      }
    }
    if (!targetAddress) {
      inputErrors.targetAddress = t("wallet_send_entercorrectwalletaddress");
    }
    if (inputErrors.amount || inputErrors.targetAddress) {
      setInputErrors({
        ...inputErrors
      })
      return;
    }
    console.log("Go Next For Crosschain.", inputParams)
    setOpenCrosschainConfirmModal(true);
  }, [inputParams, chainId, maxBalance, inputErrors])

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
                    {selectTokenOptions}
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
                    {targetNetworkSelect}
                  </Col>
                </Row>
              </Col>
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
          </Card>
        </Card>
      </div>
    </div>
    {
      openCrosschainConfirmModal &&
      <CrosschainConfirmModal {...inputParams} openCrosschainConfirmModal={openCrosschainConfirmModal} cancel={cancel} />
    }
  </>
}
