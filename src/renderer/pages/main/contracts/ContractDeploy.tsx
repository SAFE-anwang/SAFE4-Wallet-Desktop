
import { LeftOutlined } from '@ant-design/icons';
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin, Input } from 'antd';
import { FunctionFragment, Interface } from 'ethers/lib/utils';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractConstructor from './ContractConstructor';
import { ethers } from 'ethers';
import { useWalletsActiveSigner } from '../../../state/wallets/hooks';
import { TransactionResponse } from '@ethersproject/providers';
import config, { IPC_CHANNEL } from '../../../config';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import { useWeb3React } from '@web3-react/core';
import { useTransactionAdder } from '../../../state/transactions/hooks';
import { DB_AddressActivity_Actions } from '../../../../main/handlers/DBAddressActivitySingalHandler';

const { Title, Text, Link } = Typography;

const now = () => new Date().getTime()

export default () => {

  const { chainId } = useWeb3React();
  const addTransaction = useTransactionAdder();
  const navigate = useNavigate();
  const signer = useWalletsActiveSigner();
  const directDeploy = useSelector<AppState, boolean | undefined>(state => state.application.control.directDeploy);

  const compile = useSelector<AppState, {
    sourceCode: string, abi: string, bytecode: string, name: string ,
    compileOption : {
      compileVersion: string,
      evmVersion: string,
      optimizer: {
        enabled: boolean,
        runs: number
      }
    }
  } | undefined>(state => state.application.control.compile);
  const { abi, bytecode, name, sourceCode , compileOption } = useMemo(() => {
    if (!compile || directDeploy) {
      return {
        abi: undefined,
        bytecode: undefined,
        name: undefined,
        sourceCode: undefined,
        compileOption : undefined,
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

  const deployContract = () => {

    setDeployHash(undefined);
    setDeployError(undefined);

    if (!params?.abi) {
      inputErrors.abi = "请输入合约ABI"
    }
    if (!params?.bytecode) {
      inputErrors.bytecode = "请输入合约字节码"
    }
    if (inputErrors.abi || inputErrors.bytecode) {
      setInputErrors({
        ...inputErrors
      })
      return;
    }

    //
    const { abi, bytecode } = params;
    if (signer?.address && abi && bytecode) {
      const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
      setDeploying(true);
      contractFactory.deploy(...constructorValues).then((contract) => {
        const transactionHash = contract.deployTransaction.hash;
        console.log("deploy transaction :" , contract.deployTransaction)
        addTransaction({ to: contract.address }, contract.deployTransaction, {
          call: {
            from: signer.address,
            to: contract.address,
            input: contract.deployTransaction.data,
            value: "0" ,
            type : DB_AddressActivity_Actions.Create
          }
        });

        // 合约部署成功后,将交易哈希以及相关信息存储到 Contracts 表中.
        const method = ContractCompile_Methods.save;
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
          {
            address: contract.address,
            creator: signer?.address,
            chainId: chainId,
            name,
            bytecode,
            abi,
            sourceCode,
            compileOption: JSON.stringify(compileOption),
            transactionHash,
            addedTime : now()
          }
        ]]);

        setDeploying(false);
        setDeployHash(transactionHash);

      }).catch((err: any) => {
        setDeploying(false);
        setDeployError(err.toString());
      })
    }
  }

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          合约部署
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          {
            directDeploy &&
            <Alert type='info' message={<>
              通过智能合约编辑器 (<Link onClick={() => window.open("https://remix.ethereum.org")}>Remix</Link>) 等工具编写合约后,将合约编译出的ABI和字节码复制到输入框来部署合约.
            </>} />
          }
          <Spin spinning={deploying}>
            <Row style={{ marginTop: "20px" }}>
              <Col span={24}>
                <Text strong type='secondary'>合约ABI</Text>
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
                <Text strong type='secondary'>合约字节码(Bytecode)</Text>
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
                        <Text>交易哈希:{deployHash}</Text>
                        <Link onClick={() => window.open(`${config.Safescan_URL}/tx/${deployHash}`)} style={{ float: "right" }}>浏览器上查看</Link>
                      </Col>
                    </Row>
                  </>} />
                }
                <Button onClick={deployContract} type='primary'>部署</Button>
              </Col>
            </Row>
          </Spin>
        </Card>



      </div>
    </div>

  </>

}
