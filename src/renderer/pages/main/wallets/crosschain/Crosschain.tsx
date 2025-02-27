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

const { Title, Text, Link } = Typography;

const { Option } = Select;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];

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
    if (inputParams.token == 'USDT') {
      return tokenUSDTBalance?.toFixed(2);
    } else {
      return activeAccountETHBalance?.toFixed(2);
    }
  }, [activeAccountETHBalance, tokenUSDTBalance, inputParams.token]);

  const maxBalanceClick = useMemo(() => {
    return () => {
      if (activeAccountETHBalance && tokenUSDTBalance) {
        if (inputParams.token == 'USDT') {
          setInputParams({
            ...inputParams,
            amount: tokenUSDTBalance.toExact()
          })
        } else {
          setInputParams({
            ...inputParams,
            amount: activeAccountETHBalance.toExact()
          })
        }
      }
    }
  }, [inputParams.token, activeAccountETHBalance, tokenUSDTBalance]);

  const goNext = useCallback( () => {

  } , [inputParams] )

  const [inputErrors , setInputErrors] = useState<{
    amount ?: string,
    targetAddress ?: string
  }>({});

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          跨链
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                将 Safe4 网络上的资产 SAFE, USDT 跨链到其他网络
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          <Card style={{ width: "50%", margin: "auto" }}>
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>选择代币</Text>
                <Text style={{ float: "right" }} type="secondary">可用余额:{tokenBalance}</Text>
              </Col>
              <Col span={16}>
                <Input value={inputParams.amount} size="large" style={{ height: "80px", width: "520px", fontSize: "24px" }}
                  onChange={(event) => {
                    setInputParams({
                      ...inputParams,
                      amount: event.target.value
                    })
                  }} />
              </Col>
              <Col span={8}>
                <Row style={{ marginTop: "24px" }}>
                  <Col span={8}>
                    <div style={{ marginTop: "4px" }}>
                      <Link onClick={maxBalanceClick}>最大</Link>
                      <Divider type="vertical" />
                    </div>
                  </Col>
                  <Col span={16}>
                    {selectTokenOptions}
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <ArrowDownOutlined style={{ fontSize: "24px", color: "green", marginTop: "10px", marginBottom: "10px" }} />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary" strong>选择目标网络</Text>
              </Col>
              <Col span={16}>
                <Input readOnly size="large" style={{ height: "80px", width: "520px", background: "#efefef" }} />
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
                <Text type="secondary" strong>跨链到账地址</Text>
              </Col>
              <Col span={16}>
                <Input value={inputParams.targetAddress} size="large" style={{ width: "520px" }} />
              </Col>
            </Row>
            <Divider></Divider>
            <Row>
              <Col span={24}>
                <Button type="primary" style={{ float: "right" }}>下一步</Button>
              </Col>
            </Row>
          </Card>
        </Card>
      </div>
    </div>

  </>

}
