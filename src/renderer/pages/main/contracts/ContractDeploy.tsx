
import { LeftOutlined } from '@ant-design/icons';
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin, Input } from 'antd';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractConstructor from './ContractConstructor';
import { ethers } from 'ethers';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { TransactionResponse } from '@ethersproject/providers';
import config, { IPC_CHANNEL } from '../../../config';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import { useWeb3React } from '@web3-react/core';
import { useTransactionAdder } from '../../../state/transactions/hooks';
import { DB_AddressActivity_Actions } from '../../../../main/handlers/DBAddressActivitySingalHandler';
import { useTranslation } from 'react-i18next';
import Safescan, { SafescanComponentType } from '../../components/Safescan';
import EstimateTx from '../../../utils/EstimateTx';

const { Title, Text, Link } = Typography;

const now = () => new Date().getTime()

export default () => {

  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const addTransaction = useTransactionAdder();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const directDeploy = useSelector<AppState, boolean | undefined>(state => state.application.control.directDeploy);

  const compile = useSelector<AppState, {
    sourceCode: string, abi: string, bytecode: string, name: string,
    compileOption: {
      compileVersion: string,
      evmVersion: string,
      optimizer: {
        enabled: boolean,
        runs: number
      }
    }
  } | undefined>(state => state.application.control.compile);
  const { abi, bytecode, name, sourceCode, compileOption } = useMemo(() => {
    if (!compile || directDeploy) {
      return {
        abi: undefined,
        bytecode: undefined,
        name: undefined,
        sourceCode: undefined,
        compileOption: undefined,
      }
    }
    return compile;
  }, [compile, directDeploy]);

  const [params, setParams] = useState<{
    abi: string | undefined,
    bytecode: string | undefined,
    constructorParams: any[] | undefined
  }>({
    abi,
    bytecode,
    constructorParams: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    abi: string | undefined,
    bytecode: string | undefined
  }>({
    abi: undefined,
    bytecode: undefined
  });

  const [deployHash, setDeployHash] = useState<string>();
  const [deployError, setDeployError] = useState<string>();
  const [deploying, setDeploying] = useState<boolean>(false);

  const [IContract, setIContract] = useState<Interface>();
  const [constructorValues, setConstructorValues] = useState<any[]>([]);

  useEffect(() => {
    setIContract(undefined);
    setConstructorValues([]);
    if (params?.abi) {
      try {
        const IContract = new Interface(params.abi);
        setIContract(IContract);
      } catch (err: any) {
        setIContract(undefined);
        setInputErrors({
          ...inputErrors,
          abi: err.toString()
        })
      }
    }
  }, [params]);

  useEffect(() => {
    console.log("deploy page constructor values>>", constructorValues)
  }, [constructorValues]);

  const deployContract = async () => {

    setDeployHash(undefined);
    setDeployError(undefined);

    if (!params?.abi) {
      inputErrors.abi = t("enter") + t("wallet_contracts_deploy_contractabi")
    }
    if (!params?.bytecode) {
      inputErrors.bytecode = t("enter") + t("wallet_contracts_deploy_contractbytecode")
    }
    if (inputErrors.abi || inputErrors.bytecode) {
      setInputErrors({
        ...inputErrors
      })
      return;
    }

    //
    const { abi, bytecode } = params;
    if (abi && bytecode && provider && chainId) {

      setDeploying(true);

      try {

        const contractFactory = new ethers.ContractFactory(abi, bytecode);
        const encodeConstructorData = contractFactory.interface.encodeDeploy(constructorValues);
        const data = contractFactory.bytecode + encodeConstructorData.slice(2);

        let tx: ethers.providers.TransactionRequest = {
          data,
          chainId
        };

        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (error) {
            setDeployError(error.reason);
          }
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data, from } = response;
            const contractAddress = ethers.utils.getContractAddress(response);
            addTransaction({ to: contractAddress }, response, {
              call: {
                from: activeAccount,
                to: contractAddress,
                input: data,
                value: "0",
                type: DB_AddressActivity_Actions.Create
              }
            });
            // 合约部署成功后,将交易哈希以及相关信息存储到 Contracts 表中.
            const method = ContractCompile_Methods.save;
            window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
              {
                address: contractAddress,
                creator: activeAccount,
                chainId: chainId,
                name,
                bytecode,
                abi,
                sourceCode,
                compileOption: JSON.stringify(compileOption),
                hash,
                addedTime: now()
              }
            ]]);
            setDeployHash(hash);
          }
        } catch (err: any) {
          setDeployError(err.body);
        } finally {
          setDeploying(false);
        }
      } catch (err: any) {
        console.log(err);
        setDeployError(err.message);
      } finally {
        setDeploying(false);
      }
    }
  }

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_contracts_deploy")}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          {
            directDeploy &&
            <Alert type='info' message={<>
              {t("wallet_contracts_deploy_dotip0")} (<Link onClick={() => window.open("https://remix.ethereum.org")}>Remix</Link>) {t("wallet_contracts_deploy_dotip1")}
            </>} />
          }
          <Spin spinning={deploying}>
            <Row style={{ marginTop: "20px" }}>
              <Col span={24}>
                <Text strong type='secondary'>{t("wallet_contracts_deploy_contractabi")}</Text>
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Input.TextArea defaultValue={abi} onBlur={(event) => {
                  setParams({
                    ...params,
                    abi: event.target.value
                  });
                }} onChange={() => {
                  setInputErrors({
                    ...inputErrors,
                    abi: undefined
                  })
                }} disabled={!directDeploy} style={{ minHeight: "100px" }} />
              </Col>
              {
                inputErrors?.abi && <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors?.abi} />
              }

              <Col span={24} style={{ marginTop: "20px" }}>
                <Text strong type='secondary'>{t("wallet_contracts_deploy_contractbytecode")}</Text>
              </Col>
              <Col span={24} style={{ marginTop: "5px" }}>
                <Input.TextArea defaultValue={bytecode} onBlur={(event) => {
                  setParams({
                    ...params,
                    bytecode: event.target.value
                  });
                }} onChange={() => {
                  setInputErrors({
                    ...inputErrors,
                    bytecode: undefined
                  })
                }} disabled={!directDeploy} style={{ minHeight: "100px" }} />
              </Col>

              {
                inputErrors?.bytecode && <Alert style={{ marginTop: "5px" }} type='error' showIcon message={inputErrors.bytecode} />
              }

              {
                IContract && IContract.deploy.inputs.length > 0 && <>
                  <Divider />
                  <ContractConstructor IContract={IContract} setConstructorValues={setConstructorValues} />
                </>
              }
              <Divider />

              <Col span={24}>
                {
                  deployError && <Alert style={{ marginBottom: "20px" }} showIcon type='error' message={<>
                    {deployError}
                  </>} />
                }
                {
                  deployHash && <Alert style={{ marginBottom: "20px" }} showIcon type='success' message={<>
                    <Row>
                      <Col span={24}>
                        <Text>{t("transactionHash")}:{deployHash}</Text>
                        <Text style={{ float: "right" }} >
                          <Safescan url={`/tx/${deployHash}`} type={SafescanComponentType.Link} />
                        </Text>
                      </Col>
                    </Row>
                  </>} />
                }
                <Button onClick={deployContract} type='primary'>{t("wallet_contracts_deploy_button")}</Button>
              </Col>
            </Row>
          </Spin>
        </Card>



      </div>
    </div>

  </>

}
