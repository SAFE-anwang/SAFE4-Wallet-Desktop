import { CurrencyAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Avatar, Button, Card, Col, Divider, Flex, Input, Radio, Row, Typography } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"
import { ContractCompileSignal, ContractCompile_Methods } from "../../../../../main/handlers/ContractCompileHandler";
import { DB_AddressActivity_Actions } from "../../../../../main/handlers/DBAddressActivitySingalHandler";
import { IPC_CHANNEL } from "../../../../config";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import Safescan from "../../../components/Safescan";
import { NFT_Template, NFT_Template_CompileOption, NFT_Template_Option } from "./NFT_Template_Config";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { useNavigate } from "react-router-dom";
import EstimateTx from "../../../../utils/EstimateTx";

const { Text, Title, Link } = Typography;
const now = () => new Date().getTime()


export default () => {

  const { t } = useTranslation();
  const addTransaction = useTransactionAdder();
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const balanceGtZERO = balance && balance.greaterThan(CurrencyAmount.ether("0"));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showBaseURITip, setShowBaseURITip] = useState<boolean>(false);

  const options: CheckboxGroupProps<NFT_Template_Option>['options'] = [
    { label: "NFT(SRC721) 资产", value: NFT_Template_Option.SRC721 },
    { label: "可销毁的 NFT(SRC721) 资产", value: NFT_Template_Option.SRC721_burnable },
  ];

  const [inputParams, setInputParams] = useState<{
    templateType: NFT_Template_Option,
    name: string,
    symbol: string,
    baseURI: string,
    maxSupply: string,
    mintPrice: string
  }>({
    templateType: NFT_Template_Option.SRC721,
    name: "",
    symbol: "",
    baseURI: "",
    maxSupply: "",
    mintPrice: ""
  });

  const [inputErrors, setInputErrors] = useState<{
    name?: string,
    symbol?: string,
    baseURI?: string,
    maxSupply?: string,
    mintPrice?: string
  }>();

  const [deploy, setDeploy] = useState<{
    execute?: boolean,
    txHash?: string,
    error?: any
  }>();

  const issue = async () => {
    const { name, symbol, baseURI, maxSupply, mintPrice } = inputParams;
    const errors: {
      name?: string,
      symbol?: string,
      totalSupply?: string
    } = {};
    if (!name) {
      errors.name = t("please_enter") + t("wallet_issue_asset_name");
    }
    if (!symbol) {
      errors.symbol = t("please_enter") + t("wallet_issue_asset_symbol");
    }
    if (!maxSupply) {
      errors.totalSupply = t("please_enter") + t("wallet_issue_asset_totalsupply");
    } else {
      try {
        const _totalSupply = ethers.utils.parseUnits(maxSupply);
        if (!_totalSupply.gt(0)) {
          errors.totalSupply = "初始供应量必须大于零"
        }
      } catch (err: any) {
        errors.totalSupply = "请输入正确的数量"
      }
    }
    if (errors.name || errors.symbol || errors.totalSupply) {
      setInputErrors({ ...errors });
      return;
    }
    // 执行发行资产
    if (chainId && provider) {
      setDeploy({
        ...deploy,
        execute: true,
      })
      const compileOption = NFT_Template_CompileOption;
      const { abi, bytecode, sourceCode } = NFT_Template[inputParams.templateType];
      const contractFactory = new ethers.ContractFactory(abi, bytecode);
      const constructorValues = [name, symbol, baseURI, BigNumber.from(maxSupply), ethers.utils.parseEther(mintPrice)];
      const encodeConstructorData = contractFactory.interface.encodeDeploy(constructorValues);
      const data = contractFactory.bytecode + encodeConstructorData.slice(2);
      let tx: ethers.providers.TransactionRequest = {
        data,
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data, from } = response;
          const contractAddress = ethers.utils.getContractAddress(response);
          setDeploy({
            ...deploy,
            execute: false,
            txHash: hash
          });
          addTransaction({ to: contractAddress }, response, {
            call: {
              from,
              to: contractAddress,
              input: data,
              value: "0",
              type: DB_AddressActivity_Actions.Create
            }
          });
          const method = ContractCompile_Methods.save;
          window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
            {
              address: contractAddress,
              creator: activeAccount,
              chainId: chainId,
              name: "SRC721",
              bytecode,
              abi,
              sourceCode,
              compileOption: JSON.stringify(compileOption),
              hash,
              addedTime: now()
            }
          ]]);
          dispatch(applicationUpdateWalletTab("history"));
          navigate("/main/wallet");
        } catch (err) {
          setDeploy({
            ...deploy,
            execute: false,
            error: err
          })
        }
        if (error) {
          setDeploy({
            ...deploy,
            execute: false,
            error: error
          })
        }
      }
    }
  }

  const RenderTemplateTip = () => {
    switch (inputParams.templateType) {
      case NFT_Template_Option.SRC721:
        return <>
          <Text>{t("wallet_issue_template_src20_tip")}</Text>
        </>
      case NFT_Template_Option.SRC721_burnable:
        return <>
          <Text>合约管理者可以销毁指定 TokenID 的 NFT 资产</Text>
        </>
    }
    return <></>
  }

  const exampleNFTMetadata = {
    name: "",
    description: "",
    image: "https://yourwebsite/1.png"
  }

  return <>
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_issue_selecttemplate")}</Text>
      </Col>
      <Col span={24}>
        <Flex vertical gap="middle">
          <Radio.Group options={options} onChange={(event) => {
            setInputParams({
              ...inputParams,
              templateType: event.target.value
            })
          }} defaultValue={NFT_Template_Option.SRC721} />
        </Flex>
      </Col>
      <Col span={24} style={{ marginTop: "10px" }}>
        <Card>
          {RenderTemplateTip()}
        </Card>
      </Col>

      <Col span={24} style={{ marginTop: "10px" }}>
        <Row>
          <Col span={8}>
            <Row>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text type="secondary">{t("wallet_issue_asset_name")}</Text>
                <br />
                <Input value={inputParams.name} onChange={(event) => {
                  const inputName = event.target.value.trim();
                  setInputParams({
                    ...inputParams,
                    name: inputName
                  });
                  setInputErrors({
                    ...inputErrors,
                    name: undefined
                  })
                }} style={{ width: "80%" }} />
                {
                  inputErrors?.name &&
                  <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.name} />
                }
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text type="secondary">{t("wallet_issue_asset_symbol")}</Text>
                <br />
                <Input value={inputParams.symbol} onChange={(event) => {
                  const inputSymbol = event.target.value.trim();
                  setInputParams({
                    ...inputParams,
                    symbol: inputSymbol
                  });
                  setInputErrors({
                    ...inputErrors,
                    symbol: undefined
                  })
                }} style={{ width: "80%" }} />
                {
                  inputErrors?.symbol &&
                  <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.symbol} />
                }
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text type="secondary">BaseURI</Text>
                <br />
                <Input value={inputParams.baseURI} placeholder="https://yourwebsite/" onChange={(event) => {
                  const baseURI = event.target.value.trim();
                  setInputParams({
                    ...inputParams,
                    baseURI: baseURI
                  });
                  setInputErrors({
                    ...inputErrors,
                    baseURI: undefined
                  })
                }} style={{ width: "80%" }}
                  onFocus={() => {
                    setShowBaseURITip(true)
                  }}
                />
                {
                  inputErrors?.baseURI &&
                  <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.baseURI} />
                }
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text type="secondary">最大供应量</Text>
                <br />
                <Input value={inputParams.maxSupply} onChange={(event) => {
                  const inputTotalSupply = event.target.value.trim();
                  setInputParams({
                    ...inputParams,
                    maxSupply: inputTotalSupply
                  });
                  setInputErrors({
                    ...inputErrors,
                    maxSupply: undefined
                  })
                }} style={{ width: "80%" }} />
                {
                  inputErrors?.maxSupply &&
                  <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.maxSupply} />
                }
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Text type="secondary">铸造价格(SAFE)</Text>
                <br />
                <Input value={inputParams.mintPrice} onChange={(event) => {
                  const mintPrice = event.target.value.trim();
                  setInputParams({
                    ...inputParams,
                    mintPrice: mintPrice
                  });
                  setInputErrors({
                    ...inputErrors,
                    maxSupply: undefined
                  })
                }} style={{ width: "80%" }} />
                {
                  inputErrors?.mintPrice &&
                  <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.mintPrice} />
                }
              </Col>
            </Row>
          </Col>
          <Col span={16}>
            {
              showBaseURITip && <>
                <Alert message={<>
                  <Row>
                    <Col span={24}>
                      <Text strong>BaseURI</Text>
                    </Col>
                    <Col span={24}>
                      <ul>
                        <li>在合约中为每一个 NFT 资产返回一个访问链接</li>
                        <Text type="secondary">
                          <Text>
                            在 BaseURI 中填写 <Text code>https://yourwebsite/</Text>
                          </Text>
                          <pre style={{
                            background: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace'
                          }}>
                            {String.raw`function tokenURI(uint256 tokenId) public pure override returns (string memory) {
  return "https://yourwebsite/{tokenId}";
}
                          `}
                          </pre>
                          <Text>
                            tokenURI(1) : https://yourwebsite/1
                          </Text>
                        </Text>
                        <li>在链接中按照 <Link onClick={() => window.open("https://docs.opensea.io/docs/metadata-standards")}>Metadata standards</Link> 返回 JSON</li>
                        <Text type="secondary">
                          <pre style={{
                            background: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace'
                          }}>
                            {JSON.stringify(exampleNFTMetadata, null, 2)}
                          </pre>
                        </Text>
                      </ul>
                    </Col>
                  </Row>
                </>} />
              </>
            }
          </Col>
        </Row>
      </Col>
    </Row>

    <Divider />
    <Row>
      <Col span={24}>
        {
          deploy?.txHash && <Alert style={{ marginBottom: "5px" }} type="success" showIcon message={<>
            <Row>
              <Col span={18}>
                <Text>交易哈希:{deploy.txHash}</Text>
              </Col>
              <Col span={6} style={{ textAlign: "right" }}>
                <Safescan url={`/tx/${deploy.txHash}`} />
              </Col>
            </Row>
          </>} />
        }
        {
          deploy?.error && <Alert style={{ marginBottom: "5px" }} type="error" showIcon message={<>
            <Row>
              <Col span={24}>
                <Text type="danger">失败</Text>
              </Col>
              <Col span={24}>
                <Text>{deploy.error.toString()}</Text>
              </Col>
            </Row>
          </>} />
        }
        <Button disabled={!balanceGtZERO || deploy?.txHash || deploy?.error} loading={deploy?.execute}
          onClick={issue} style={{}} type="primary">{t("wallet_issue_asset_doissue")}</Button>
      </Col>
    </Row>
  </>

}
