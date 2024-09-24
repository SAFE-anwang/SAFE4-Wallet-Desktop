import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Input, Slider, Alert, Radio, Space, Spin, Select } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useActiveAccountChildWallets, useETHBalances, useWalletsActiveAccount, useWalletsActiveKeystore, useWalletsActivePrivateKey, useWalletsKeystores, useWalletsList } from '../../../../state/wallets/hooks';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../../hooks/useContracts';
import RegisterModalConfirm from './RegisterModal-Confirm';
import NumberFormat from '../../../../utils/NumberFormat';
import { Safe4_Business_Config } from '../../../../config';
import CallMulticallAggregate, { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from '../../../../state/multicall/CallMulticallAggregate';
import SSH2CMDTerminalNodeModal from '../../../components/SSH2CMDTerminalNodeModal';
import { generateChildWallet, NodeAddressSelectType, SupportChildWalletType, SupportNodeAddressSelectType } from '../../../../utils/GenerateChildWallet';
import AddressComponent from '../../../components/AddressComponent';
import useAddrNodeInfo from '../../../../hooks/useAddrIsNode';
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
  const [openSSH2CMDTerminalNodeModal, setOpenSSH2CMDTerminalNodeModal] = useState<boolean>(false);
  const walletsActiveKeystore = useWalletsActiveKeystore();
  const activeAccountChildWallets = useActiveAccountChildWallets(SupportChildWalletType.MN);
  const [nodeAddressPrivateKey, setNodeAddressPrivateKey] = useState<string>();
  const [nodeAddress, setNodeAddress] = useState<string>();
  const [nodeAddressSelectType, setNodeAddressSelectType] = useState<SupportNodeAddressSelectType>();
  const [helpResult, setHelpResult] = useState<
    {
      enode: string,
      nodeAddress: string
    }
  >();
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
    address: undefined,
    enode: undefined,
    description: undefined,
    incentivePlan: {
      creator: 50,
      partner: 50,
    }
  });
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
  const [checking, setChecking] = useState<boolean>(false);
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);

  useEffect(() => {
    if (walletsActiveKeystore?.mnemonic) {
      setNodeAddressSelectType(NodeAddressSelectType.GEN)
    } else {
      setNodeAddressSelectType(NodeAddressSelectType.INPUT)
    }
  }, [walletsActiveKeystore]);

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
      const addrIsFounderCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "existFounder",
        params: [address]
      };
      const addrExistInSupernodesCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "exist",
        params: [address]
      };
      const addrIsSupernodeFounderCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "existFounder",
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
        addrExistCall, addrIsFounderCall, addrExistInSupernodesCall, addrIsSupernodeFounderCall,
        enodeExistCall, enodeExistInSupernodesCall
      ], () => {
        const addrExistsInMasternodes: boolean = addrExistCall.result;
        const addrExistsInSupernodes: boolean = addrExistInSupernodesCall.result;
        const enodeExistsInMasternodes: boolean = enodeExistCall.result;
        const enodeExistsInSupernodes: boolean = enodeExistInSupernodesCall.result;
        const addrIsFounder: boolean = addrIsFounderCall.result;
        const addrIsSupernodeFounder: boolean = addrExistInSupernodesCall.result;
        setChecking(false);
        if (addrExistsInMasternodes || addrExistsInSupernodes) {
          if (addrExistsInMasternodes) {
            inputErrors.address = "该地址已经是主节点地址,无法使用";
          }
          if (addrExistsInSupernodes) {
            inputErrors.address = "该地址已经是超级节点地址,无法使用";
          }
          setInputErrors({ ...inputErrors });
          return;
        }
        if (addrIsFounder || addrIsSupernodeFounder) {
          if (addrIsFounder) {
            inputErrors.address = "该地址已参与主节点地址创建,无法使用";
          }
          if (addrIsSupernodeFounder) {
            inputErrors.address = "该地址已参与超级节点地址创建,无法使用";
          }
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

  useEffect(() => {
    setRegisterParams({
      ...registerParams,
      address: undefined,
      enode: undefined
    });
    setInputErrors({
      ...inputErrors,
      balance: undefined,
      address: undefined
    });
    // 清楚使用 ssh 连接后做的数据
    setNodeAddress(undefined);
    setNodeAddressPrivateKey(undefined);
    setHelpResult(undefined);
  }, [walletsActiveKeystore]);

  const selectChildWalletOptions = useMemo(() => {
    if (activeAccountChildWallets && nodeAddressSelectType) {
      const options = Object.keys(activeAccountChildWallets.wallets)
        .map(childAddress => {
          const { path, exist } = activeAccountChildWallets.wallets[childAddress];
          return {
            address: childAddress,
            path,
            exist,
            index: path.substring(Number(path.lastIndexOf("/") + 1))
          }
        })
        .sort((a: any, b: any) => (a.index - b.index))
        .map(({ address, path, exist, index }) => {
          return {
            value: address,
            label: <>
              <Row key={address}>
                <Col span={16}>
                  <Row>
                    {
                      exist && <Col span={4}>
                        <Text type='secondary'>[已注册]</Text>
                      </Col>
                    }
                    <Col span={20}>
                      <AddressComponent ellipsis address={address} />
                    </Col>
                  </Row>
                </Col>
                <Col span={8} style={{ textAlign: "right", float: "right" }}>
                  <Text type='secondary'>{path}</Text>
                </Col>
              </Row>
            </>,
            disabled: exist
          }
        })
      return options;
    }
  }, [activeAccount, activeAccountChildWallets, nodeAddressSelectType]);

  // 子钱包加载后,自动设置可用的第一个子钱包作为默认选择;
  useEffect(() => {
    if (!registerParams.address && selectChildWalletOptions && nodeAddressSelectType == NodeAddressSelectType.GEN) {
      const couldSelect = selectChildWalletOptions.filter(option => !option.disabled);
      if (couldSelect && couldSelect.length > 0) {
        setRegisterParams({
          ...registerParams,
          address: couldSelect[0].value
        });
        setInputErrors({
          ...inputErrors,
          address: undefined
        });
      }
    }
  }, [registerParams, selectChildWalletOptions, nodeAddressSelectType]);

  const helpToCreate = useCallback(() => {
    if (registerParams.address && activeAccountChildWallets && activeAccountChildWallets.wallets[registerParams.address]
      && walletsActiveKeystore?.mnemonic
    ) {
      const path = activeAccountChildWallets.wallets[registerParams.address].path;
      const hdNode = generateChildWallet(
        walletsActiveKeystore.mnemonic,
        walletsActiveKeystore.password ? walletsActiveKeystore.password : "",
        path
      );
      setNodeAddress(hdNode.address);
      setNodeAddressPrivateKey(hdNode.privateKey);
      setOpenSSH2CMDTerminalNodeModal(true);
    }
  }, [registerParams, walletsActiveKeystore, activeAccountChildWallets]);

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
        <div style={{ width: "50%", margin: "auto", marginTop: "20px" }}>
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
            <Text type='secondary'>主节点地址</Text>
            <Alert style={{ marginTop: "5px", marginBottom: "5px" }} type='warning' showIcon message={<>
              <Row>
                <Col span={24}>
                  主节点运行时,节点程序需要加载主节点地址的私钥来签名见证凭证.
                </Col>
                <Col span={24}>
                  由于该主节点地址的私钥会被远程存放在您的节点服务器上,<Text type='danger' strong>请避免向这个主节点地址进行资产转账.</Text>
                </Col>
                <Col span={24}>
                  钱包通过当前账户的种子密钥派生一个新地址来作为主节点地址
                </Col>
              </Row>
            </>} />
            <Col span={24}>
              {
                nodeAddressSelectType == NodeAddressSelectType.INPUT &&
                <Alert showIcon type="error" message={<>
                  当前账户没有种子密钥(助记词),无法派生子地址.不可使用辅助功能
                </>} />
              }
              {
                nodeAddressSelectType == NodeAddressSelectType.GEN &&
                <Spin spinning={false}>
                  <Select
                    style={{
                      width: "100%",
                      marginTop: "5px"
                    }}
                    placeholder="正在加载可用的主节点地址..."
                    options={selectChildWalletOptions}
                    disabled={helpResult ? true : false}
                    onChange={(value) => {
                      setRegisterParams({
                        ...registerParams,
                        address: value
                      });
                      setInputErrors({
                        ...inputErrors,
                        address: undefined
                      })
                    }}
                    value={registerParams.address}
                  />
                </Spin>
              }
              {
                inputErrors && inputErrors.address &&
                <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.address} showIcon></Alert>
              }
            </Col>
          </Row>
          {
            helpResult && helpResult.enode && <>
              <Divider />
              <Row>
                <Col span={24}>
                  <QuestionCircleOutlined onClick={() => setEnodeTips(true)} style={{ cursor: "pointer", marginRight: "5px" }} /><Text type='secondary'>ENODE</Text>
                </Col>
                {
                  enodeTips && <Col span={24} style={{ marginBottom: "10px", marginTop: "5px" }}>
                    <Alert type='info' message={<>
                      <Text>ENODE是主节点在 Safe4网络 中与其他节点进行通信时的标识</Text><br />
                      <Text>对于网络中所有节点,该值都是<Text strong>唯一的</Text></Text>
                    </>} />
                  </Col>
                }
                <Input.TextArea style={{ height: "100px" }} status={inputErrors.enode ? "error" : ""}
                  disabled={helpResult ? true : false}
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
            </>
          }
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
            {
              !helpResult &&
              <Col span={24}>
                {
                  activeAccountNodeInfo?.isNode && <div style={{ textAlign: "left", marginBottom: "20px" }}>
                    <Alert type='warning' showIcon message={<>
                      {`当前账户已经是${activeAccountNodeInfo.isMN ? '主节点' : '超级节点'},不可再创建节点`}
                    </>} />
                  </div>
                }
                <Button disabled={nodeAddressSelectType != NodeAddressSelectType.GEN || activeAccountNodeInfo?.isNode} onClick={() => {
                  helpToCreate();
                }} type='primary' style={{ float: "right" }}>
                  下一步
                </Button>
              </Col>
            }
            {
              helpResult &&
              <Col span={24}>
                <Button disabled={activeAccountNodeInfo?.isNode} loading={checking} type="primary" onClick={() => {
                  nextClick();
                }}>下一步</Button>
              </Col>
            }
          </Row>
        </div>
      </Card>
    </Row>

    <RegisterModalConfirm openRegisterModal={openRegisterModal} setOpenRegisterModal={setOpenRegsterModal} registerParams={registerParams} />

    {
      openSSH2CMDTerminalNodeModal && nodeAddress &&
      <SSH2CMDTerminalNodeModal openSSH2CMDTerminalNodeModal={openSSH2CMDTerminalNodeModal} setOpenSSH2CMDTerminalNodeModal={setOpenSSH2CMDTerminalNodeModal}
        nodeAddress={nodeAddress} nodeAddressPrivateKey={nodeAddressPrivateKey}
        onSuccess={(enode: string, nodeAddress: string) => {
          setHelpResult({ enode, nodeAddress });
          setRegisterParams({
            ...registerParams,
            address: nodeAddress,
            enode
          });
          setInputErrors({
            ...inputErrors,
            address: undefined,
            enode: undefined
          })
        }}
        onError={() => {

        }} />
    }

  </>

}
