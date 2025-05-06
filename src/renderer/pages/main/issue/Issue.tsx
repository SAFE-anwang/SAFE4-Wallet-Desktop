import { CurrencyAmount } from "@uniswap/sdk";
import { useWeb3React } from "@web3-react/core";
import { Alert, Button, Card, Col, Divider, Flex, Input, Radio, Row, Typography } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"
import { ContractCompileSignal, ContractCompile_Methods } from "../../../../main/handlers/ContractCompileHandler";
import { DB_AddressActivity_Actions } from "../../../../main/handlers/DBAddressActivitySingalHandler";
import { IPC_CHANNEL } from "../../../config";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks";
import Safescan from "../../components/Safescan";
import { SRC20_Template, SRC20_Template_CompileOption, SRC20_Template_Option } from "./SRC20_Template_Config";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../state/application/action";
import { useNavigate } from "react-router-dom";

const { Text, Title, Link } = Typography;
const now = () => new Date().getTime()

export default () => {

  const { t } = useTranslation();
  const signer = useWalletsActiveSigner();
  const addTransaction = useTransactionAdder();
  const { chainId } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const balanceGtZERO = balance && balance.greaterThan(CurrencyAmount.ether("0"));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const options: CheckboxGroupProps<SRC20_Template_Option>['options'] = [
    { label: t("wallet_issue_template_src20"), value: SRC20_Template_Option.SRC20 },
    { label: t("wallet_issue_template_src20_mintable"), value: SRC20_Template_Option.SRC20_mintable },
    { label: t("wallet_issue_template_src20_burnable"), value: SRC20_Template_Option.SRC20_burnable },
    { label: t("wallet_issue_template_src20_pausable"), value: SRC20_Template_Option.SRC20_pausable },
  ];

  const [inputParams, setInputParams] = useState<{
    templateType: SRC20_Template_Option,
    name: string,
    symbol: string,
    totalSupply: string,
  }>({
    templateType: SRC20_Template_Option.SRC20,
    name: "",
    symbol: "",
    totalSupply: ""
  });

  const [inputErrors, setInputErrors] = useState<{
    name?: string,
    symbol?: string,
    totalSupply?: string
  }>();

  const [deploy, setDeploy] = useState<{
    execute?: boolean,
    txHash?: string,
    error?: any
  }>();

  const issue = () => {
    const { name, symbol, totalSupply } = inputParams;
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
    if (!totalSupply) {
      errors.totalSupply = t("please_enter") + t("wallet_issue_asset_totalsupply");
    } else {
      try {
        const _totalSupply = ethers.utils.parseUnits(totalSupply);
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
    if (signer && chainId) {
      const { abi, bytecode, sourceCode } = SRC20_Template[inputParams.templateType];
      const compileOption = SRC20_Template_CompileOption;
      const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
      const constructorValues = [name, symbol, ethers.utils.parseUnits(totalSupply)];
      setDeploy({
        ...deploy,
        execute: true,
      })
      contractFactory.deploy(...constructorValues).then((contract) => {
        const transactionHash = contract.deployTransaction.hash;
        setDeploy({
          ...deploy,
          execute: false,
          txHash: transactionHash
        });
        addTransaction({ to: contract.address }, contract.deployTransaction, {
          call: {
            from: signer.address,
            to: contract.address,
            input: contract.deployTransaction.data,
            value: "0",
            type: DB_AddressActivity_Actions.Create
          }
        });
        const method = ContractCompile_Methods.save;
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
          {
            address: contract.address,
            creator: signer?.address,
            chainId: chainId,
            name: "SRC20",
            bytecode,
            abi,
            sourceCode,
            compileOption: JSON.stringify(compileOption),
            transactionHash,
            addedTime: now()
          }
        ]]);
        dispatch(applicationUpdateWalletTab("history"));
        navigate("/main/wallet");
      }).catch((err: any) => {
        setDeploy({
          ...deploy,
          execute: false,
          error: err
        })
      })
    }
  }

  const RenderTemplateTip = () => {
    switch (inputParams.templateType) {
      case SRC20_Template_Option.SRC20:
        return <>
          <Text>{t("wallet_issue_template_src20_tip")}</Text>
        </>
      case SRC20_Template_Option.SRC20_mintable:
        return <>
          <Text>{t("wallet_issue_template_src20_mintable_tip")}</Text>
        </>
      case SRC20_Template_Option.SRC20_burnable:
        return <>
          <Text>{t("wallet_issue_template_src20_burnable_tip")}</Text>
        </>
      case SRC20_Template_Option.SRC20_pausable:
        return <>
          <Text>{t("wallet_issue_template_src20_pausable_tip")}</Text>
        </>
    }
    return <></>
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
          }} defaultValue={SRC20_Template_Option.SRC20} />
        </Flex>
      </Col>
      <Col span={24} style={{ marginTop: "10px" }}>
        <Card>
          {RenderTemplateTip()}
        </Card>
      </Col>
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
        }} style={{ width: "30%" }} />
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
        }} style={{ width: "30%" }} />
        {
          inputErrors?.symbol &&
          <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.symbol} />
        }
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">{t("wallet_issue_asset_totalsupply")}</Text>
        <br />
        <Input value={inputParams.totalSupply} onChange={(event) => {
          const inputTotalSupply = event.target.value.trim();
          setInputParams({
            ...inputParams,
            totalSupply: inputTotalSupply
          });
          setInputErrors({
            ...inputErrors,
            totalSupply: undefined
          })
        }} style={{ width: "30%" }} />
        {
          inputErrors?.totalSupply &&
          <Alert type="error" style={{ marginTop: "5px", width: "30%" }} showIcon message={inputErrors.totalSupply} />
        }
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
