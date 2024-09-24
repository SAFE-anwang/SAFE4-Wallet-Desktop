import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";

import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { CloseCircleTwoTone, LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AppState } from "../../../../state";
import { formatMasternode, MasternodeInfo } from "../../../../structs/Masternode";
import { useMasternodeLogicContract, useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from "../../../../hooks/useContracts";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { generateChildWallet, NodeAddressSelectType, SupportChildWalletType, SupportNodeAddressSelectType } from "../../../../utils/GenerateChildWallet";
import { useActiveAccountChildWallets, useWalletsActiveAccount, useWalletsActiveKeystore } from "../../../../state/wallets/hooks";
import { TxExecuteStatus } from "../../safe3/Safe3";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../../state/multicall/CallMulticallAggregate";
import { enodeRegex } from "../../supernodes/Register/SupernodeRegister";
import { InputRules } from "../Register/MasternodeRegister";
import AddressComponent from "../../../components/AddressComponent";
import SSH2CMDTerminalNodeModal from "../../../components/SSH2CMDTerminalNodeModal";

const { Text, Title } = Typography

export default () => {

  const navigate = useNavigate();
  const editMasternodeId = useSelector((state: AppState) => state.application.control.editMasternodeId);
  const [masternodeInfo, setMasternodeInfo] = useState<MasternodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeLogicContract = useMasternodeLogicContract(true);
  const addTransaction = useTransactionAdder();
  const multicallContract = useMulticallContract();
  const [nodeAddressSelectType, setNodeAddressSelectType] = useState<SupportNodeAddressSelectType>();
  const walletsActiveKeystore = useWalletsActiveKeystore();
  const activeAccountChildWallets = useActiveAccountChildWallets(SupportChildWalletType.MN);
  const activeAccount = useWalletsActiveAccount();
  const [openSSH2CMDTerminalNodeModal, setOpenSSH2CMDTerminalNodeModal] = useState<boolean>(false);
  const [nodeAddressPrivateKey, setNodeAddressPrivateKey] = useState<string>();
  const [helpResult, setHelpResult] = useState<
    {
      enode: string,
      nodeAddress: string
    }
  >();
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateParams, setUpdateParams] = useState<{
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined
  }>({
    address: undefined,
    enode: undefined,
    description: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    address?: string,
    enode?: string,
    description?: string
  }>();
  const [updateResult, setUpdateResult] = useState<{
    address?: TxExecuteStatus,
    enode?: TxExecuteStatus,
    description?: TxExecuteStatus
  }>();

  const isNodeCreator = useMemo(() => {
    return masternodeInfo?.creator == activeAccount;
  }, [masternodeInfo, activeAccount]);

  const needUpdate = useMemo(() => {
    return masternodeInfo?.addr != updateParams.address
      || masternodeInfo?.enode != updateParams.enode
      || masternodeInfo?.description != updateParams.description
  }, [masternodeInfo, updateParams]);

  useEffect(() => {
    if (walletsActiveKeystore?.mnemonic) {
      setNodeAddressSelectType(NodeAddressSelectType.GEN)
    } else {
      setNodeAddressSelectType(NodeAddressSelectType.INPUT)
    }
  }, [walletsActiveKeystore]);

  useEffect(() => {
    if (editMasternodeId && masternodeStorageContract) {
      masternodeStorageContract.callStatic.getInfoByID(editMasternodeId).then(_masternodeInfo => {
        const masternodeInfo = formatMasternode(_masternodeInfo);
        setMasternodeInfo(masternodeInfo);
        setUpdateParams({
          address: masternodeInfo.addr,
          enode: masternodeInfo.enode,
          description: masternodeInfo.description
        });
      });
    }
  }, [editMasternodeId, masternodeStorageContract]);

  const selectChildWalletOptions = useMemo(() => {
    if (activeAccountChildWallets && nodeAddressSelectType && masternodeInfo) {
      const options = Object.keys(activeAccountChildWallets.wallets)
        .map(childAddress => {
          const { path, exist } = activeAccountChildWallets.wallets[childAddress];
          return {
            address: childAddress,
            path,
            exist: exist ? childAddress != masternodeInfo?.addr : exist,
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
                      exist && <Col span={6}>
                        <Text type='secondary'>[已注册]</Text>
                      </Col>
                    }
                    {
                      address == masternodeInfo.addr && <Col span={6}>
                        <Text type='secondary'>[当前节点]</Text>
                      </Col>
                    }
                    <Col span={18}>
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
  }, [activeAccount, activeAccountChildWallets, nodeAddressSelectType, masternodeInfo]);

  // 子钱包加载后,自动设置可用的第一个子钱包作为默认选择;
  useEffect(() => {
    if (selectChildWalletOptions && nodeAddressSelectType == NodeAddressSelectType.GEN && masternodeInfo) {
      const couldSelect = selectChildWalletOptions.filter(option => !option.disabled);
      if (couldSelect && couldSelect.length > 0) {
        setUpdateParams({
          ...updateParams,
          address: couldSelect[0].value
        });
        setInputErrors({
          ...inputErrors,
          address: undefined
        });
      }
    }
  }, [masternodeInfo, selectChildWalletOptions, nodeAddressSelectType]);

  const doUpdate = useCallback(async () => {
    if (masternodeStorageContract && supernodeStorageContract && multicallContract && masternodeLogicContract && masternodeInfo) {
      const { address, enode, description } = updateParams;
      const inputErrors: {
        address?: string, enode?: string, description?: string
      } = {};
      if (!address) {
        inputErrors.address = "请输入主节点地址";
      } else if (!ethers.utils.isAddress(address)) {
        inputErrors.address = "请输入合法的主节点地址";
      }
      if (!enode) {
        inputErrors.enode = "请输入主节点ENODE";
      } else {
        const isMatch = enodeRegex.test(enode);
        if (!isMatch) {
          inputErrors.enode = "主节点ENODE格式不正确!";
        }
      }
      if (!description) {
        inputErrors.description = "请输入主节点简介";
      } else if (description.length < InputRules.description.min || description.length > InputRules.description.max) {
        inputErrors.description = `简介信息长度需要大于${InputRules.description.min}且小于${InputRules.description.max}`;
      }
      if (inputErrors.address || inputErrors.enode || inputErrors.description) {
        setInputErrors(inputErrors);
        return;
      }
      // Check Address;
      setUpdating(true);
      if (address != masternodeInfo.addr) {
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
        await SyncCallMulticallAggregate(multicallContract, [addrExistCall, addrIsFounderCall, addrExistInSupernodesCall, addrIsSupernodeFounderCall])
        const addrExistsInMasternodes: boolean = addrExistCall.result;
        const addrExistsInSupernodes: boolean = addrExistInSupernodesCall.result;
        const addrIsFounder: boolean = addrIsFounderCall.result;
        const addrIsSupernodeFounder: boolean = addrExistInSupernodesCall.result;
        if (addrExistsInMasternodes || addrExistsInSupernodes) {
          if (addrExistsInMasternodes) {
            inputErrors.address = "该地址已经是主节点地址,无法使用";
          }
          if (addrExistsInSupernodes) {
            inputErrors.address = "该地址已经是超级节点地址,无法使用";
          }
        }
        if (addrIsFounder || addrIsSupernodeFounder) {
          if (addrIsFounder) {
            inputErrors.address = "该地址已参与主节点地址创建,无法使用";
          }
          if (addrIsSupernodeFounder) {
            inputErrors.address = "该地址已参与超级节点地址创建,无法使用";
          }
        }
      }
      // Check Enode
      if (enode != masternodeInfo.enode) {
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
        await SyncCallMulticallAggregate(multicallContract, [enodeExistCall, enodeExistInSupernodesCall]);
        const enodeExistsInMasternodes: boolean = enodeExistCall.result;
        const enodeExistsInSupernodes: boolean = enodeExistInSupernodesCall.result;
        if (enodeExistsInMasternodes || enodeExistsInSupernodes) {
          inputErrors.enode = "该ENODE已被使用";
        }
      }
      if (inputErrors.address || inputErrors.enode) {
        setInputErrors({ ...inputErrors });
        setUpdating(false);
        return;
      }

      let _updateResult = updateResult ?? {};
      // DO update address
      if (masternodeInfo.addr != address) {
        try {
          const response = await masternodeLogicContract.changeAddress(masternodeInfo.addr, address);
          const { hash, data } = response;
          addTransaction({ to: masternodeLogicContract.address }, response, {
            call: {
              from: activeAccount,
              to: masternodeLogicContract.address,
              input: data,
              value: "0"
            }
          });
          _updateResult.address = {
            txHash: hash,
            status: 1,
          }
        } catch (err: any) {
          _updateResult.address = {
            status: 0,
            error: err.error.reason
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Address 无变化,不需更新");
      }
      // DO Update Enode
      if (masternodeInfo.enode != enode) {
        try {
          const response = await masternodeLogicContract.changeEnode(address, enode);
          const { hash, data } = response;
          addTransaction({ to: masternodeLogicContract.address }, response, {
            call: {
              from: activeAccount,
              to: masternodeLogicContract.address,
              input: data,
              value: "0"
            }
          });
          _updateResult.enode = {
            txHash: hash,
            status: 1,
          }
        } catch (err: any) {
          _updateResult.enode = {
            status: 0,
            error: err.error.reason
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("ENODE 无变化,不需更新");
      }
      // DO Update description
      if (description != masternodeInfo.description) {
        try {
          const response = await masternodeLogicContract.changeDescription(address, description);
          const { hash, data } = response;
          addTransaction({ to: masternodeLogicContract.address }, response, {
            call: {
              from: activeAccount,
              to: masternodeLogicContract.address,
              input: data,
              value: "0"
            }
          });
          _updateResult.description = {
            status: 1,
            txHash: hash
          }
        } catch (err: any) {
          _updateResult.description = {
            status: 1,
            error: err.error.reason
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Description 无变化,不需更新");
      }
      // 执行完毕;
      console.log("执行完毕");
      setUpdating(false);
    }
  }, [activeAccount, updateParams, masternodeStorageContract, supernodeStorageContract, multicallContract, masternodeLogicContract, masternodeInfo]);

  const helpToCreate = useCallback(() => {
    if (updateParams.address && activeAccountChildWallets && activeAccountChildWallets.wallets[updateParams.address]
      && walletsActiveKeystore?.mnemonic
    ) {
      const path = activeAccountChildWallets.wallets[updateParams.address].path;
      const hdNode = generateChildWallet(
        walletsActiveKeystore.mnemonic,
        walletsActiveKeystore.password ? walletsActiveKeystore.password : "",
        path
      );
      setNodeAddressPrivateKey(hdNode.privateKey);
    }
    setOpenSSH2CMDTerminalNodeModal(true);
  }, [updateParams, walletsActiveKeystore, activeAccountChildWallets]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/masternodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑主节点
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>

          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type="secondary">主节点ID</Text>
            </Col>
            <Col>
              <Text strong>{masternodeInfo?.id}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Text type="secondary">创建者</Text>
            </Col>
            <Col span={24}>
              {
                masternodeInfo && <AddressComponent address={masternodeInfo?.creator} />
              }
            </Col>
            {
              isNodeCreator && <>
                <Col span={24} style={{ marginTop: "20px" }}>
                  <Text type="secondary">主节点地址</Text>
                  <Alert style={{ marginTop: "5px", marginBottom: "5px" }} type='warning' showIcon message={<>
                    <Row>
                      <Col span={24}>
                        主节点运行时,节点程序需要加载主节点地址的私钥来签名见证凭证.
                      </Col>
                      <Col span={24}>
                        由于该主节点地址的私钥会被远程存放在您的节点服务器上,<Text type='danger' strong>请避免向这个主节点地址进行资产转账.</Text>
                      </Col>
                    </Row>
                  </>} />
                </Col>
                <Col span={24}>
                  {
                    nodeAddressSelectType == NodeAddressSelectType.INPUT &&
                    <Input style={{ marginTop: "5px" }} value={updateParams?.address} placeholder='输入主节点地址' disabled={true}
                      onChange={(event) => {
                        const input = event.target.value.trim();
                        setUpdateParams({
                          ...updateParams,
                          address: input
                        });
                        setInputErrors({
                          ...inputErrors,
                          address: undefined
                        })
                      }} />
                  }
                  {
                    nodeAddressSelectType == NodeAddressSelectType.GEN &&
                    <>
                      <Radio.Group value={nodeAddressSelectType} disabled={helpResult != undefined}
                        onChange={(event) => {
                          setUpdateParams({
                            ...updateParams,
                            address: masternodeInfo?.addr
                          });
                          setNodeAddressSelectType(event.target.value);
                        }}>
                        <Space style={{ height: "20px" }} direction="vertical">
                          <Radio disabled={walletsActiveKeystore?.mnemonic == undefined}
                            value={NodeAddressSelectType.GEN}>
                            钱包通过当前账户的种子密钥生成子地址作为主节点地址
                          </Radio>
                        </Space>
                      </Radio.Group>
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
                            setUpdateParams({
                              ...updateParams,
                              address: value
                            });
                            setInputErrors({
                              ...inputErrors,
                              address: undefined
                            })
                          }}
                          value={updateParams.address}
                        />
                      </Spin>
                    </>
                  }
                  {
                    inputErrors?.address && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.address} />
                  }
                </Col>
                {
                  helpResult && helpResult.enode && <>
                    <Divider />
                    <Col span={24} style={{ marginTop: "20px" }}>
                      <Text type="secondary">ENODE</Text>
                    </Col>
                    <Col span={24}>
                      <Input.TextArea style={{ height: "100px" }} value={updateParams.enode} disabled={helpResult != undefined}
                        onChange={(event) => {
                          const input = event.target.value.trim();
                          setUpdateParams({
                            ...updateParams,
                            enode: input
                          });
                          setInputErrors({
                            ...inputErrors,
                            enode: undefined
                          })
                        }} />
                      {
                        inputErrors?.enode && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.enode} />
                      }
                    </Col>
                  </>
                }
                <Divider />
                <Col span={24}>
                  <Text type="secondary">主节点简介</Text>
                </Col>
                <Col span={24}>
                  <Input.TextArea style={{ height: "100px" }} value={updateParams.description} onChange={(event) => {
                    const input = event.target.value.trim();
                    setUpdateParams({
                      ...updateParams,
                      description: input
                    });
                    setInputErrors({
                      ...inputErrors,
                      description: undefined
                    })
                  }} />
                  {
                    inputErrors?.description && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.description} />
                  }
                </Col>
              </>
            }
          </Row>
          <Divider />
          <Row>

            <Col span={24}>
              {
                updateResult &&
                <>
                  <Alert style={{ marginTop: "20px", marginBottom: "20px" }} type="success" message={<>
                    {
                      updateResult.address && <>
                        {
                          updateResult.address.status == 1 && <>
                            <Text type="secondary">地址更新交易哈希</Text><br />
                            <Text strong>{updateResult.address.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.address.status == 0 && <>
                            <Text type="secondary">地址更新失败</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.address.error}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.enode && <>
                        {
                          updateResult.enode.status == 1 && <>
                            <Text type="secondary">ENODE更新交易哈希</Text><br />
                            <Text strong>{updateResult.enode.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.enode.status == 0 && <>
                            <Text type="secondary">ENODE更新失败</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.enode.error}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.description && <>
                        {
                          updateResult.description.status == 1 && <>
                            <Text type="secondary">简介更新交易哈希</Text><br />
                            <Text strong>{updateResult.description.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.description.status == 0 && <>
                            <Text type="secondary">简介更新失败</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.description.error}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    <br />
                    <Text italic>更新数据交易发出后,等待交易确认,主节点的信息才会同步更新到整个 Safe4 网络</Text>
                  </>} />
                </>
              }
            </Col>

            <Col span={24} style={{ textAlign: "right" }}>
              {
                !helpResult && isNodeCreator && <>
                  <Button onClick={() => helpToCreate()} type='primary'>下一步</Button>
                </>
              }
              {
                helpResult && helpResult.enode && <>
                  {
                    !needUpdate && updateResult == undefined &&
                    <Alert style={{ textAlign: "left" }} showIcon type="info" message={<>
                      主节点信息与主节点服务器数据一致,无需调用合约更新数据
                    </>} />
                  }
                  {
                    needUpdate &&
                    <Button disabled={!isNodeCreator || (updateResult != undefined && !updating)} type="primary" onClick={doUpdate} loading={updating}>更新</Button>
                  }
                </>
              }
              {
                !isNodeCreator && <>
                  <Alert style={{ marginTop: "5px", textAlign: "left" }} type="warning" showIcon message={"只有节点的创建人才能操作该节点"} />
                </>
              }
            </Col>

          </Row>
        </div>
      </Card>
    </Row>

    {
      openSSH2CMDTerminalNodeModal && updateParams.address &&
      <SSH2CMDTerminalNodeModal openSSH2CMDTerminalNodeModal={openSSH2CMDTerminalNodeModal} setOpenSSH2CMDTerminalNodeModal={setOpenSSH2CMDTerminalNodeModal}
        nodeAddress={updateParams.address} nodeAddressPrivateKey={nodeAddressPrivateKey}
        onSuccess={(enode: string, nodeAddress: string) => {
          setHelpResult({ enode, nodeAddress });
          setUpdateParams({
            ...updateParams,
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

