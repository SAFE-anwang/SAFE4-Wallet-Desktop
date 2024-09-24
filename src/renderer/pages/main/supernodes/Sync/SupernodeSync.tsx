import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";

import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { CloseCircleTwoTone, LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AppState } from "../../../../state";
import { useMasternodeLogicContract, useMasternodeStorageContract, useMulticallContract, useSupernodeLogicContract, useSupernodeStorageContract } from "../../../../hooks/useContracts";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useWalletsActiveAccount, useWalletsActiveKeystore } from "../../../../state/wallets/hooks";
import { TxExecuteStatus } from "../../safe3/Safe3";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../../state/multicall/CallMulticallAggregate";
import { enodeRegex, InputRules } from "../Register/SupernodeRegister";
import AddressComponent from "../../../components/AddressComponent";
import { formatSupernodeInfo, SupernodeInfo } from "../../../../structs/Supernode";
import { SuperNodeLogicABI } from "../../../../constants/SystemContractAbiConfig";

const { Text, Title } = Typography

export default () => {

  const navigate = useNavigate();
  const editSupernodeId = useSelector((state: AppState) => state.application.control.editSupernodeId);
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const supernodeLoginContract = useSupernodeLogicContract(true);
  const addTransaction = useTransactionAdder();
  const multicallContract = useMulticallContract();
  const activeAccount = useWalletsActiveAccount();
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateParams, setUpdateParams] = useState<{
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    name: string | undefined
  }>({
    address: undefined,
    enode: undefined,
    description: undefined,
    name: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    address?: string,
    enode?: string,
    description?: string,
    name?: string,
  }>();
  const [updateResult, setUpdateResult] = useState<{
    address?: TxExecuteStatus,
    enode?: TxExecuteStatus,
    description?: TxExecuteStatus,
    name?: TxExecuteStatus
  }>();

  const isNodeCreator = useMemo(() => {
    return supernodeInfo?.creator == activeAccount;
  }, [supernodeInfo, activeAccount]);
  const needUpdate = useMemo(() => {
    return supernodeInfo?.addr != updateParams.address
      || supernodeInfo?.enode != updateParams.enode
      || supernodeInfo?.description != updateParams.description
      || supernodeInfo?.name != updateParams.name
  }, [supernodeInfo, updateParams]);

  useEffect(() => {
    if (editSupernodeId && supernodeStorageContract) {
      supernodeStorageContract.callStatic.getInfoByID(editSupernodeId).then(_supernodeInfo => {
        const supernodeInfo = formatSupernodeInfo(_supernodeInfo);
        setSupernodeInfo(supernodeInfo);
        setUpdateParams({
          address: supernodeInfo.addr,
          enode: supernodeInfo.enode,
          description: supernodeInfo.description,
          name: supernodeInfo.name
        });
      });
    }
  }, [editSupernodeId, supernodeStorageContract]);

  const doUpdate = useCallback(async () => {
    if (masternodeStorageContract && supernodeStorageContract && multicallContract && supernodeLoginContract && supernodeInfo) {
      const { address, enode, description, name } = updateParams;
      const inputErrors: {
        address?: string, enode?: string, description?: string, name?: string
      } = {};
      if (!address) {
        inputErrors.address = "请输入超级节点地址";
      } else if (!ethers.utils.isAddress(address)) {
        inputErrors.address = "请输入合法的超级节点地址";
      }
      if (!enode) {
        inputErrors.enode = "请输入超级节点ENODE";
      } else {
        const isMatch = enodeRegex.test(enode);
        if (!isMatch) {
          inputErrors.enode = "超级节点ENODE格式不正确!";
        }
      }
      if (!description) {
        inputErrors.description = "请输入超级节点简介";
      } else if (description.length < InputRules.description.min || description.length > InputRules.description.max) {
        inputErrors.description = `简介信息长度需要大于${InputRules.description.min}且小于${InputRules.description.max}`;
      }
      if (inputErrors.address || inputErrors.enode || inputErrors.description) {
        setInputErrors(inputErrors);
        return;
      }
      // Check Address;
      setUpdating(true);
      if (address != supernodeInfo.addr) {
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
            inputErrors.address = "该地址已参与主点地址创建,无法使用";
          }
          if (addrIsSupernodeFounder) {
            inputErrors.address = "该地址已参与超级节点地址创建,无法使用";
          }
        }
      }
      // Check Enode
      if (enode != supernodeInfo.enode) {
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
      // Check Name
      if (name != supernodeInfo.name) {
        const nameExist = await supernodeStorageContract.callStatic.existName(name);
        if (nameExist) {
          inputErrors.name = "该名称已被其他超级节点使用";
        }
      }
      if (inputErrors.address || inputErrors.enode || inputErrors.name) {
        setInputErrors({ ...inputErrors });
        setUpdating(false);
        return;
      }
      let _updateResult = updateResult ?? {};
      // DO update address
      if (supernodeInfo.addr != address) {
        try {
          const response = await supernodeLoginContract.changeAddress(supernodeInfo.addr, address);
          const { hash, data } = response;
          addTransaction({ to: supernodeLoginContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeLoginContract.address,
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
      if (supernodeInfo.enode != enode) {
        try {
          const response = await supernodeLoginContract.changeEnode(address, enode);
          const { hash, data } = response;
          addTransaction({ to: supernodeLoginContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeLoginContract.address,
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
      if (description != supernodeInfo.description) {
        try {
          const response = await supernodeLoginContract.changeDescription(address, description);
          const { hash, data } = response;
          addTransaction({ to: supernodeLoginContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeLoginContract.address,
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
      // DO Update name
      if (name != supernodeInfo.name) {
        try {
          const response = await supernodeLoginContract.changeName(address, name);
          const { hash, data } = response;
          addTransaction({ to: supernodeLoginContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeLoginContract.address,
              input: data,
              value: "0"
            }
          });
          _updateResult.name = {
            status: 1,
            txHash: hash
          }
        } catch (err: any) {
          console.log("Error >>", err)
          _updateResult.name = {
            status: 1,
            error: err.error.reason
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Name 无变化,不需更新");
      }
      // 执行完毕;
      console.log("执行完毕");
      setUpdating(false);
    }
  }, [activeAccount, updateParams, masternodeStorageContract, supernodeStorageContract, multicallContract, supernodeLoginContract, supernodeInfo]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          同步超级节点信息
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>

          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type="secondary">超级节点ID</Text>
            </Col>
            <Col>
              <Text strong>{supernodeInfo?.id}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Text type="secondary">创建者</Text>
            </Col>
            <Col span={24}>
              {
                supernodeInfo && <AddressComponent address={supernodeInfo?.creator} />
              }
            </Col>
            {
              isNodeCreator && <>
                <Col span={24} style={{ marginTop: "20px" }}>
                  <Text type="secondary">超级节点地址</Text>
                </Col>
                <Col span={24}>
                  <Input style={{ marginTop: "5px" }} value={updateParams?.address} placeholder='输入超级节点地址'
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
                  {
                    inputErrors?.address && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.address} />
                  }
                </Col>
                <Divider />
                <Col span={24}>
                  <Text type="secondary">超级节点ENODE</Text>
                </Col>
                <Col span={24}>
                  <Input.TextArea style={{ height: "100px" }} value={updateParams.enode}
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

                <Divider />
                <Col span={24}>
                  <Text type="secondary">超级节点名称</Text>
                </Col>
                <Col span={24}>
                  <Input value={updateParams.name} onChange={(event) => {
                    const input = event.target.value.trim();
                    setUpdateParams({
                      ...updateParams,
                      name: input
                    });
                    setInputErrors({
                      ...inputErrors,
                      name: undefined
                    })
                  }} />
                  {
                    inputErrors?.name && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={inputErrors.name} />
                  }
                </Col>
                <Divider />
                <Col span={24}>
                  <Text type="secondary">超级节点简介</Text>
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
                  <Alert style={{ marginTop: "20px" , marginBottom:"20px" }} type="success" message={<>
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
                      updateResult.name && <>
                        {
                          updateResult.name.status == 1 && <>
                            <Text type="secondary">名称更新交易哈希</Text><br />
                            <Text strong>{updateResult.name.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.name.status == 0 && <>
                            <Text type="secondary">名称更新失败</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.name.error}
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
                    <Text italic>更新数据交易发出后,等待交易确认,超级节点的信息才会同步更新到整个 Safe4 网络</Text>
                  </>}/>
                </>
              }
            </Col>

            <Col span={24} style={{ textAlign: "right" }}>
              {
                isNodeCreator &&
                <Button disabled={!needUpdate || (updateResult != undefined && !updating) } type="primary" onClick={doUpdate} loading={updating}>更新</Button>
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

  </>

}

