import { Alert, Button, Card, Col, Divider, Input, Row, Spin, Typography } from "antd"
import { FunctionFragment, Interface } from "ethers/lib/utils"
import { RefObject, useCallback, useRef, useState } from "react"
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks"
import { TransactionResponse } from "@ethersproject/providers"
import { ethers } from "ethers"
import { useTransactionAdder } from "../../../state/transactions/hooks"
import { ExportOutlined } from "@ant-design/icons"
import Safescan from "../../components/Safescan"

const { Text } = Typography

interface ContractCall {
  encodeFunctionData?: string,
  returnOutputRaw?: string,
  decodeFunctionResult?: any,
  transactionHash?: string
}

export default ({
  functionFragment,
  IContract,
  address
}: {
  functionFragment: FunctionFragment,
  IContract: Interface,
  address: string
}) => {

  const signer = useWalletsActiveSigner();
  const { inputs, outputs, constant, payable } = functionFragment;
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const addTransaction = useTransactionAdder();

  const inputRefs: {
    [inputName: string]: RefObject<{ input: HTMLInputElement }>
  } = {};
  inputs.forEach((input) => {
    inputRefs[input.name] = useRef<{ input: HTMLInputElement }>(null);
  });
  const [payableAmount, setPayableAmount] = useState<string>();

  const [sending, setSending] = useState<boolean>(false);
  const [contractCall, setContractCall] = useState<ContractCall>();
  const [contractCallError, setContractCallError] = useState<{
    encodeError?: string,
    returnError?: string
  }>();

  const encodeInputParams = useCallback(() => {
    setContractCallError(undefined);
    setContractCall(undefined);
    const inputParams: {
      [name: string]: any
    } = {};
    Object.keys(inputRefs).forEach(inputName => {
      if (inputRefs[inputName].current) {
        const value = inputRefs[inputName].current?.input.value;
        inputParams[inputName] = value;
      }
    });
    console.log(`Function-${functionFragment.name} :: ${JSON.stringify(inputParams)}`)
    const values: any[] = [];
    inputs.forEach((input, index) => {
      const { name, type } = input;
      if (type.endsWith("[]")) {
        values.push(JSON.parse(inputParams[name]));
      } else {
        values.push(inputParams[name]);
      }
    });
    let encodeFunctionData = "";
    let value = ethers.utils.parseEther("0");
    try {
      encodeFunctionData = IContract.encodeFunctionData(functionFragment, values);
      value = (payable && payableAmount) ? ethers.utils.parseEther(payableAmount) : ethers.utils.parseEther("0");
    } catch (err: any) {
      console.log("catch encode err!", err);
      setContractCallError({
        encodeError: err.toString()
      })
      return;
    }
    setContractCall({
      encodeFunctionData: encodeFunctionData
    });
    console.log(`Function-${functionFragment.name} :: ${encodeFunctionData}`);
    const tx = {
      to: address,
      data: encodeFunctionData,
      value
      // 你可以添加其他交易参数，例如 gasLimit 和 gasPrice
    };

    if (signer) {
      setSending(true);
      const { constant } = functionFragment;
      if (!constant) {
        signer.sendTransaction(tx).then((transactionResponse: TransactionResponse) => {
          setSending(false);
          const { hash } = transactionResponse;
          setContractCall({
            encodeFunctionData,
            transactionHash: hash
          });
          addTransaction({ to: address }, transactionResponse, {
            call: {
              from: activeAccount,
              to: address,
              input: encodeFunctionData,
              value: value.toString()
            }
          });
        }).catch((err: any) => {
          setSending(false);
          console.log("send Transaction err >>", err);
          setContractCallError({
            returnError: err.error.reason
          })
        })
      } else {
        signer.call(tx).then((returnOutputRaw: any) => {
          setSending(false);
          console.log("function encode >>", contractCall)
          const decodeFunctionResult = IContract.decodeFunctionResult(functionFragment, returnOutputRaw);
          setContractCall({
            encodeFunctionData,
            returnOutputRaw,
            decodeFunctionResult
          })
        }).catch((err: any) => {
          setSending(false);
          setContractCallError({
            returnError: err.toString()
          })
        })
      }
    }

  }, [IContract, functionFragment, inputRefs, payableAmount]);

  const renderDecodeResultElement = (output: any, decodeResult: any) => {
    const { type, components } = output;
    const tuple: {
      [name: string]: string
    } = {};
    if (type == "tuple" && components) {
      components.forEach((paramType: any) => {
        const { name, type } = paramType;
        tuple[name] = decodeResult[name].toString();
      })
    }
    return <>
      {
        !components && decodeResult.toString()
      }
      {
        components && <>
          <Text>{`{`}</Text><br />
          {
            Object.keys(tuple).map((name: string) => {
              return <Row key={name}>
                <Col span={4} style={{ textAlign: "right" }}>
                  {name}
                </Col>
                <Col span={18} offset={2}>
                  {tuple[name]}
                </Col>
              </Row>
            })
          }
          <Text>{`}`}</Text>
        </>
      }
    </>
  }

  return <Spin spinning={sending}>
    {/* <Text>{JSON.stringify(functionFragment)}</Text> */}
    {
      functionFragment.inputs.map((inputElement) => {
        const { name, type } = inputElement;
        return <>
          <Row key={name} style={{ marginTop: "5px" }}>
            <Col span={24}>
              {name}({type})
            </Col>
            <Col span={24}>
              <Input ref={inputRefs[name]} placeholder={`${name}(${type})`} />
            </Col>
          </Row>
        </>
      })
    }

    {
      payable && <>
        <Divider />
        <Row style={{ marginTop: "5px" }}>
          <Col span={24}>
            <Text strong>支付 SAFE</Text>
            <Divider type="vertical" />
            <Text type="secondary">账户余额:</Text>
            <Text strong type="secondary">{balance?.toFixed(6)} SAFE</Text>
          </Col>
          <Col span={24}>
            <Input onChange={(event) => { setPayableAmount(event.target.value) }}></Input>
          </Col>
        </Row>
        <Divider />
      </>
    }

    {
      (contractCall || contractCallError) &&
      <Card title="执行" style={{ marginTop: "20px" }}>
        <Row>
          <Col span={24}>
            <Text type="secondary">调用数据</Text>
          </Col>
          <Col span={24}>
            {
              contractCall?.encodeFunctionData && <Text>{contractCall?.encodeFunctionData}</Text>
            }
            {
              contractCallError?.encodeError && <>
                <Alert showIcon type="error" message={<>
                  {contractCallError.encodeError}
                </>} />
              </>
            }
          </Col>
          <Divider />
          <Col span={24}>
            <Text type="secondary">
              {
                contractCall?.transactionHash ? "交易哈希" : "响应数据"
              }
            </Text>
          </Col>
          <Col span={24}>
            {
              contractCall?.transactionHash && <>
                {contractCall.transactionHash}
                <div style={{ float: "right" }}>
                  <Safescan url={`/tx/${contractCall.transactionHash}`} />
                </div>
              </>
            }
            {
              contractCall?.returnOutputRaw && <Text>{contractCall?.returnOutputRaw}</Text>
            }
            {
              contractCallError?.returnError && <>
                <Alert showIcon type="error" message={<>
                  {contractCallError.returnError}
                </>} />
              </>
            }
          </Col>
          {
            contractCall?.decodeFunctionResult && <>
              <Divider />
              <Col span={24}>
                {outputs?.map((output, index) => {
                  const { type } = output;
                  return <>
                    <Row key={index}>
                      <Col span={1}>
                        <Text type="secondary" style={{ float: "right" }}>
                          {index}
                        </Text>
                      </Col>
                      <Col span={3}>
                        <Text type="secondary">
                          <Divider type="vertical" />
                          ({type})
                        </Text>
                      </Col>
                      <Col span={18}>
                        <Text strong>
                          {renderDecodeResultElement(output, contractCall.decodeFunctionResult[index])}
                        </Text>
                      </Col>
                    </Row>
                  </>
                })}
              </Col>
            </>
          }
        </Row>
      </Card>
    }

    <Button onClick={() => encodeInputParams()} type="primary" style={{ marginTop: "10px" }}>
      {constant ? "Call" : "Send"}
    </Button>

  </Spin>
}
