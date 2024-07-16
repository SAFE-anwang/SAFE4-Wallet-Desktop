import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Input, Slider, Alert, Radio, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { LeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Currency, CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useETHBalances, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../../hooks/useContracts';
import RegisterModalConfirm from './RegisterModal-Confirm';
import NumberFormat from '../../../../utils/NumberFormat';
import { Safe4_Business_Config } from '../../../../config';
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from '../../../../state/multicall/CallMulticallAggregate';
const { Text, Title } = Typography;

export const Masternode_Create_Type_NoUnion = 1;
export const Masternode_create_type_Union = 2;

export const InputRules = {
  description: {
    min: 12,
    max: 600
  }
}

export default () => {

  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const multicallContract = useMulticallContract();
  const [openRegisterModal, setOpenRegsterModal] = useState<boolean>(false);
  const [enodeTips, setEnodeTips] = useState<boolean>(false);

  const [registerParams, setRegisterParams] = useState<{
    registerType: number | 1,
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    incentivePlan: {
      creator: number,
      partner: number,
    }
  }>({
    registerType: Masternode_Create_Type_NoUnion,
    address: activeAccount,
    enode: undefined,
    description: undefined,
    incentivePlan: {
      creator: 50,
      partner: 50,
    }
  });

  useEffect(() => {
    setRegisterParams({
      ...registerParams,
      address: activeAccount
    })
    setInputErrors({
      ...inputErrors,
      balance: undefined,
      address: undefined
    })
  }, [activeAccount]);

  const [sliderVal, setSliderVal] = useState<number>(50);
  const [inputErrors, setInputErrors] = useState<{
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    balance: string | undefined
  }>({
    address: undefined,
    enode: undefined,
    description: undefined,
    balance: undefined
  });

  const nextClick = async () => {
    const { enode, description, incentivePlan, address } = registerParams;
    incentivePlan.creator = sliderVal;
    incentivePlan.partner = 100 - sliderVal;
    if (!enode) {
      inputErrors.enode = "请输入主节点ENODE!";
    } else {
      const enodeRegex = /^enode:\/\/[0-9a-fA-F]{128}@(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
      const isMatch = enodeRegex.test(enode);
      if (!isMatch) {
        inputErrors.enode = "主节点ENODE格式不正确!";
      }
    }
    if (!address) {
      inputErrors.address = "请输入主节点钱包地址";
    } else {
      if (!ethers.utils.isAddress(address)) {
        inputErrors.address = "请输入合法的钱包地址";
      }
    }
    if (!description) {
      inputErrors.description = "请输入主节点简介信息!"
    };
    if (description && (description.length < InputRules.description.min || description.length > InputRules.description.max)) {
      inputErrors.description = `简介信息长度需要大于${InputRules.description.min}且小于${InputRules.description.max}`;
    }
    if (registerParams.registerType == Masternode_Create_Type_NoUnion
      && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther(
        Safe4_Business_Config.Masternode.Create.LockAmount + ""
      ))))) {
      inputErrors.balance = "账户余额不足以锁仓来创建主节点";
    }
    if (registerParams.registerType == Masternode_create_type_Union
      && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther(
        Safe4_Business_Config.Masternode.Create.UnionLockAmount + ""
      ))))) {
      inputErrors.balance = "账户余额不足以锁仓来创建主节点";
    }
    if (inputErrors.enode || inputErrors.description || inputErrors.balance || inputErrors.address) {
      setInputErrors({ ...inputErrors });
      return;
    }
    if (masternodeStorageContract && supernodeStorageContract) {
      /**
       * function existEnode(string memory _enode) external view returns (bool);
       */
      setChecking(true);

      const addrExistCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "exist",
        params: [address]
      };
      const addrExistInSupernodesCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "exist",
        params: [address]
      };
      const enodeExistCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "existEnode",
        params: [enode]
      };
      const enodeExistInSupernodesCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "existEnode",
        params: [enode]
      }

      CallMulticallAggregate(multicallContract, [
        addrExistCall, addrExistInSupernodesCall, enodeExistCall, enodeExistInSupernodesCall
      ], () => {
        const addrExistsInMasternodes : boolean = addrExistCall.result;
        const addrExistsInSupernodes : boolean = addrExistInSupernodesCall.result;
        const enodeExistsInMasternodes : boolean = enodeExistCall.result;
        const enodeExistsInSupernodes : boolean = enodeExistInSupernodesCall.result;
        setChecking(false);
        if (addrExistsInMasternodes || addrExistsInSupernodes) {
          inputErrors.address = "该钱包地址已被使用";
          setInputErrors({ ...inputErrors });
          return;
        }
        if (enodeExistsInMasternodes || enodeExistsInSupernodes) {
          inputErrors.enode = "该ENODE已被使用";
          setInputErrors({ ...inputErrors });
          return;
        }
        setOpenRegsterModal(true);
      });
    }
  }

  const [checking, setChecking] = useState<boolean>(false);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/masternodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          创建主节点
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>
          <Row>
            <Col span={24}>
              <Text type='secondary'>创建模式</Text><br />
              <Radio.Group onChange={(e) => {
                setInputErrors({
                  ...inputErrors,
                  balance: undefined
                })
                setRegisterParams({
                  ...registerParams,
                  registerType: e.target.value
                })
              }} value={registerParams.registerType}>
                <Space direction="horizontal">
                  <Radio value={1}>独立</Radio>
                  <Radio value={2}>众筹</Radio>
                </Space>
              </Radio.Group>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text type='secondary'>锁仓</Text><br />
              {
                registerParams.registerType == Masternode_Create_Type_NoUnion &&
                <Text strong>{NumberFormat(Safe4_Business_Config.Masternode.Create.LockAmount)} SAFE</Text>
              }
              {
                registerParams.registerType == Masternode_create_type_Union &&
                <Text strong>{NumberFormat(Safe4_Business_Config.Masternode.Create.UnionLockAmount)} SAFE</Text>
              }
              <br />
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type='secondary'>账户当前余额</Text><br />
              <Text type='secondary'>{balance?.toFixed(6)} SAFE</Text><br />
            </Col>
            <Col span={24}>
              {
                inputErrors && inputErrors.balance &&
                <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.balance} showIcon></Alert>
              }
            </Col>
          </Row>
          <Divider />
          <Row>
            <Text type='secondary'>主节点钱包地址</Text>
            <Input status={inputErrors.address ? "error" : ""}
              value={registerParams.address} placeholder='请输入主节点钱包地址' onChange={(event) => {
                const inputDescription = event.target.value;
                setInputErrors({
                  ...inputErrors,
                  address: undefined
                })
                setRegisterParams({
                  ...registerParams,
                  address: inputDescription
                })
              }}></Input>
            {
              inputErrors && inputErrors.address &&
              <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.address} showIcon></Alert>
            }
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <QuestionCircleOutlined onClick={() => setEnodeTips(true)} style={{ cursor: "pointer", marginRight: "5px" }} /><Text type='secondary'>ENODE</Text>
            </Col>
            {
              enodeTips && <Col span={24} style={{ marginBottom: "10px", marginTop: "5px" }}>
                <Alert type='info' message={<>
                  <Text>服务器上部署节点程序后,使用geth连接到控制台输入</Text><br />
                  <Text strong code>admin.nodeInfo</Text><br />
                  获取节点的ENODE信息
                </>} />
              </Col>
            }
            <Input.TextArea style={{ height: "100px" }} status={inputErrors.enode ? "error" : ""}
              value={registerParams.enode} placeholder='输入主节点节点ENODE' onChange={(event) => {
                const inputEnode = event.target.value;
                setInputErrors({
                  ...inputErrors,
                  enode: undefined
                })
                setRegisterParams({
                  ...registerParams,
                  enode: inputEnode
                })
              }}></Input.TextArea>
            {
              inputErrors && inputErrors.enode &&
              <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.enode} showIcon></Alert>
            }
          </Row>
          <Divider />
          <Row>
            <Text type='secondary'>简介</Text>
            <Input.TextArea style={{ height: "100px" }} status={inputErrors.description ? "error" : ""}
              value={registerParams.description} placeholder='请输入主节点简介信息' onChange={(event) => {
                const inputDescription = event.target.value;
                setInputErrors({
                  ...inputErrors,
                  description: undefined
                })
                setRegisterParams({
                  ...registerParams,
                  description: inputDescription
                })
              }}></Input.TextArea>
            {
              inputErrors && inputErrors.description &&
              <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.description} showIcon></Alert>
            }
          </Row>
          <Divider />

          {
            registerParams.registerType == Masternode_create_type_Union && <>
              <Row>
                <Text type='secondary'>挖矿奖励分配方案</Text>
                <br />
                <Slider style={{ width: "100%" }}
                  value={sliderVal}
                  onChange={(result: number) => {
                    if (result > 0 && result <= 50) {
                      setSliderVal(result)
                    }
                  }}
                />
                <br />
                <Row style={{ width: "100%" }}>
                  <Col span={12} style={{ textAlign: "left" }}>
                    <Text strong>创建者</Text><br />
                    <Text>{sliderVal} %</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    <Text strong>合伙人</Text><br />
                    <Text>{100 - sliderVal} %</Text>
                  </Col>
                </Row>
              </Row>
              <Divider />
            </>
          }

          <Row style={{ width: "100%", textAlign: "right" }}>
            <Col span={24}>
              <Button loading={checking} type="primary" onClick={() => {
                nextClick();
              }}>下一步</Button>
            </Col>
          </Row>
        </div>
      </Card>
    </Row>

    <RegisterModalConfirm openRegisterModal={openRegisterModal} setOpenRegisterModal={setOpenRegsterModal} registerParams={registerParams} />
  </>

}
