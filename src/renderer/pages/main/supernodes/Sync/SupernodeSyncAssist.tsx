import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Slider, Space, Spin, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";
import { ethers } from "ethers";
import { CloseCircleTwoTone, LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { AppState } from "../../../../state";
import { useMasternodeStorageContract, useMulticallContract, useSupernodeLogicContract, useSupernodeStorageContract } from "../../../../hooks/useContracts";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { generateChildWallet, NodeAddressSelectType, SupportChildWalletType, SupportNodeAddressSelectType } from "../../../../utils/GenerateChildWallet";
import { useActiveAccountChildWallets, useETHBalances, useSafe4Balance, useWalletsActiveAccount, useWalletsActiveWallet } from "../../../../state/wallets/hooks";
import { TxExecuteStatus } from "../../safe3/Safe3";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../../state/multicall/CallMulticallAggregate";
import { enodeRegex, InputRules } from "../Register/SupernodeRegister";
import AddressComponent from "../../../components/AddressComponent";
import SSH2CMDTerminalNodeModal from "../../../components/SSH2CMDTerminalNodeModal";
import { formatSupernodeInfo, SupernodeInfo } from "../../../../structs/Supernode";
import { walletsUpdateUsedChildWalletAddress } from "../../../../state/wallets/action";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../../utils/EstimateTx";

const { Text, Title } = Typography

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const editSupernodeId = useSelector((state: AppState) => state.application.control.editSupernodeId);
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const supernodeLogicContract = useSupernodeLogicContract(true);
  const addTransaction = useTransactionAdder();
  const multicallContract = useMulticallContract();
  const [nodeAddressSelectType, setNodeAddressSelectType] = useState<SupportNodeAddressSelectType>();
  const wallet = useWalletsActiveWallet();
  const activeAccountChildWallets = useActiveAccountChildWallets(SupportChildWalletType.SN);
  const activeAccount = useWalletsActiveAccount();
  const [openSSH2CMDTerminalNodeModal, setOpenSSH2CMDTerminalNodeModal] = useState<boolean>(false);
  const [nodeAddressPrivateKey, setNodeAddressPrivateKey] = useState<string>();
  const dispatch = useDispatch();
  const { chainId, provider } = useWeb3React();
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
    description: string | undefined,
    name: string | undefined,
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
    name?: TxExecuteStatus,
    incentivePlan?: TxExecuteStatus
  }>();

  const isNodeCreator = useMemo(() => {
    return supernodeInfo?.creator == activeAccount;
  }, [supernodeInfo, activeAccount]);


  const [sliderVal, setSliderVal] = useState<number[]>();
  const needUpdate = useMemo(() => {
    if (sliderVal && supernodeInfo) {
      const partner = sliderVal[0];
      const creator = sliderVal[1] - sliderVal[0];
      const voter = 100 - sliderVal[1];
      const incentivePlanChange = partner != supernodeInfo.incentivePlan.partner
        || creator != supernodeInfo.incentivePlan.creator
        || voter != supernodeInfo.incentivePlan.voter;
      return supernodeInfo?.addr != updateParams.address
        || supernodeInfo?.enode != updateParams.enode
        || supernodeInfo?.description != updateParams.description
        || supernodeInfo?.name != updateParams.name
        || incentivePlanChange;
    }
    return false;
  }, [supernodeInfo, updateParams, sliderVal]);

  const IP = useMemo(() => {
    if (supernodeInfo) {
      try {
        const enode = supernodeInfo.enode;
        const match = enode.match(/@([\d.]+):\d+/);
        const ip = match ? match[1] : null;
        return ip;
      } catch (err) {
        return undefined;
      }
    }
    return undefined;
  }, [supernodeInfo])

  useEffect(() => {
    if (wallet?.path) {
      setNodeAddressSelectType(NodeAddressSelectType.GEN)
    } else {
      setNodeAddressSelectType(NodeAddressSelectType.INPUT)
    }
  }, [wallet]);

  useEffect(() => {
    if (editSupernodeId && supernodeStorageContract) {
      supernodeStorageContract.callStatic.getInfoByID(editSupernodeId).then(_supernodeInfo => {
        const supernodeInfo = formatSupernodeInfo(_supernodeInfo);
        const { partner, creator, voter } = supernodeInfo.incentivePlan;
        setSupernodeInfo(supernodeInfo);
        setUpdateParams({
          address: supernodeInfo.addr,
          enode: supernodeInfo.enode,
          description: supernodeInfo.description,
          name: supernodeInfo.name
        });
        setSliderVal([
          partner,
          creator + partner
        ])
      });
    }
  }, [editSupernodeId, supernodeStorageContract]);

  const selectChildWalletOptions = useMemo(() => {
    if (activeAccountChildWallets && nodeAddressSelectType && supernodeInfo) {
      const options = Object.keys(activeAccountChildWallets.wallets)
        .map(childAddress => {
          const { path, exist } = activeAccountChildWallets.wallets[childAddress];
          return {
            address: childAddress,
            path,
            exist: exist ? childAddress != supernodeInfo?.addr : exist,
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
                        <Text type='secondary'>[{t("wallet_childwallet_registed")}]</Text>
                      </Col>
                    }
                    {
                      address == supernodeInfo.addr && <Col span={6}>
                        <Text type='secondary'>[{t("wallet_childwallet_currentnode")}]</Text>
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
  }, [activeAccount, activeAccountChildWallets, nodeAddressSelectType, supernodeInfo]);

  // 子钱包加载后,自动设置可用的第一个子钱包作为默认选择;
  useEffect(() => {
    if (selectChildWalletOptions && nodeAddressSelectType == NodeAddressSelectType.GEN && supernodeInfo) {
      const couldSelect = selectChildWalletOptions.filter(option => !option.disabled);
      if (couldSelect && couldSelect.length > 0 && !helpResult) {
        if (couldSelect.map(option => option.value).indexOf(supernodeInfo.addr) >= 0) {
          setUpdateParams({
            ...updateParams,
            address: supernodeInfo.addr
          });
        } else {
          setUpdateParams({
            ...updateParams,
            address: couldSelect[0].value
          });
        }
        setInputErrors({
          ...inputErrors,
          address: undefined
        });
      }
    }
  }, [supernodeInfo, selectChildWalletOptions, nodeAddressSelectType, helpResult]);

  const doUpdate = useCallback(async () => {
    if (masternodeStorageContract && supernodeStorageContract && multicallContract && supernodeLogicContract && supernodeInfo && chainId && provider) {
      const { address, enode, description, name } = updateParams;
      const inputErrors: {
        address?: string, enode?: string, description?: string
      } = {};
      if (!address) {
        inputErrors.address = t("please_enter") + t("wallet_supernodes_address");
      } else if (!ethers.utils.isAddress(address)) {
        inputErrors.address = t("enter_correct") + t("wallet_supernodes_address");
      }
      if (!enode) {
        inputErrors.enode = t("please_enter") + t("wallet_supernodes_enode");
      } else {
        const isMatch = enodeRegex.test(enode);
        if (!isMatch) {
          inputErrors.enode = t("enter_correct") + t("wallet_supernodes_enode");
        }
      }
      if (!description) {
        inputErrors.description = t("please_enter") + t("wallet_supernodes_description");
      } else if (description.length < InputRules.description.min || description.length > InputRules.description.max) {
        inputErrors.description = t("wallet_supernodes_description_lengthrule", { min: InputRules.description.min, max: InputRules.description.max })
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
            inputErrors.address = t("wallet_supernodes_address_isnodeaddress");
          }
          if (addrExistsInSupernodes) {
            inputErrors.address = t("wallet_supernodes_address_isnodeaddress");
          }
        }
        if (addrIsFounder || addrIsSupernodeFounder) {
          if (addrIsFounder) {
            inputErrors.address = t('wallet_supernodes_address_joinnode');
          }
          if (addrIsSupernodeFounder) {
            inputErrors.address = t("wallet_supernodes_address_joinnode");
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
          inputErrors.enode = t("wallet_supernodes_enodeexist");
        }
      }
      if (inputErrors.address || inputErrors.enode) {
        setInputErrors({ ...inputErrors });
        setUpdating(false);
        return;
      }

      let _updateResult = updateResult ?? {};
      // DO update address
      if (supernodeInfo.addr != address) {
        try {
          const data = supernodeLogicContract.interface.encodeFunctionData("changeAddress", [
            supernodeInfo.addr, address
          ]);
          let tx: ethers.providers.TransactionRequest = {
            to: supernodeLogicContract.address,
            data,
            chainId
          };
          tx = await EstimateTx(activeAccount, chainId, tx, provider, { doubleGasLimit: true });
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            addTransaction({ to: supernodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeLogicContract.address,
                input: data,
                value: "0"
              }
            });
            _updateResult.address = {
              txHash: hash,
              status: 1,
            }
          }
          if (error) {
            _updateResult.address = {
              status: 0,
              error: error
            }
          }
          dispatch(walletsUpdateUsedChildWalletAddress({
            address,
            used: true
          }));
        } catch (err: any) {
          _updateResult.address = {
            status: 0,
            error: err
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Address 无变化,不需更新");
      }
      // DO Update Enode
      if (supernodeInfo.enode != enode) {
        try {
          const data = supernodeLogicContract.interface.encodeFunctionData("changeEnodeByID", [
            supernodeInfo.id, enode
          ]);
          let tx: ethers.providers.TransactionRequest = {
            to: supernodeLogicContract.address,
            data,
            chainId
          };
          tx = await EstimateTx(activeAccount, chainId, tx, provider, { doubleGasLimit: true });
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            addTransaction({ to: supernodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeLogicContract.address,
                input: data,
                value: "0"
              }
            });
            _updateResult.enode = {
              txHash: hash,
              status: 1,
            }
          }
          if (error) {
            _updateResult.enode = {
              status: 0,
              error: error
            }
          }
        } catch (err: any) {
          _updateResult.enode = {
            status: 0,
            error: err
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("ENODE 无变化,不需更新");
      }
      // DO Update description
      if (description != supernodeInfo.description) {
        try {
          const data = supernodeLogicContract.interface.encodeFunctionData("changeDescriptionByID", [
            supernodeInfo.id, description
          ]);
          let tx: ethers.providers.TransactionRequest = {
            to: supernodeLogicContract.address,
            data,
            chainId
          };
          tx = await EstimateTx(activeAccount, chainId, tx, provider, { doubleGasLimit: true });
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            addTransaction({ to: supernodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeLogicContract.address,
                input: data,
                value: "0"
              }
            });
            _updateResult.description = {
              txHash: hash,
              status: 1,
            }
          }
          if (error) {
            _updateResult.description = {
              status: 0,
              error: error
            }
          }
        } catch (err: any) {
          _updateResult.description = {
            status: 0,
            error: err
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Description 无变化,不需更新");
      }

      // DO update name
      if (name != supernodeInfo.name) {
        try {

          const data = supernodeLogicContract.interface.encodeFunctionData("changeNameByID", [
            supernodeInfo.id, name
          ]);
          let tx: ethers.providers.TransactionRequest = {
            to: supernodeLogicContract.address,
            data,
            chainId
          };
          tx = await EstimateTx(activeAccount, chainId, tx, provider, { doubleGasLimit: true });
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            addTransaction({ to: supernodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeLogicContract.address,
                input: data,
                value: "0"
              }
            });
            _updateResult.name = {
              txHash: hash,
              status: 1,
            }
          }
          if (error) {
            _updateResult.name = {
              status: 0,
              error: error
            }
          }
        } catch (err: any) {
          _updateResult.name = {
            status: 0,
            error: err.error.reason
          }
        }
        setUpdateResult({ ..._updateResult });
      } else {
        console.log("Name 无变化,不需更新");
      }

      // Do Update IncentivePlan
      if (sliderVal) {
        const partner = sliderVal[0];
        const creator = sliderVal[1] - sliderVal[0];
        const voter = 100 - sliderVal[1];
        const incentivePlanChange = partner != supernodeInfo.incentivePlan.partner
          || creator != supernodeInfo.incentivePlan.creator
          || voter != supernodeInfo.incentivePlan.voter;
        if (incentivePlanChange) {
          try {
            const data = supernodeLogicContract.interface.encodeFunctionData("changeIncentivePlan", [
              supernodeInfo.id, creator, partner, voter
            ]);
            let tx: ethers.providers.TransactionRequest = {
              to: supernodeLogicContract.address,
              data,
              chainId
            };
            tx = await EstimateTx(activeAccount, chainId, tx, provider);
            const { signedTx, error } = await window.electron.wallet.signTransaction(
              activeAccount,
              tx
            );
            if (signedTx) {
              const response = await provider.sendTransaction(signedTx);
              const { hash, data } = response;
              addTransaction({ to: supernodeLogicContract.address }, response, {
                call: {
                  from: activeAccount,
                  to: supernodeLogicContract.address,
                  input: data,
                  value: "0"
                }
              });
              _updateResult.incentivePlan = {
                txHash: hash,
                status: 1,
              }
            }
            if (error) {
              _updateResult.incentivePlan = {
                status: 0,
                error: error
              }
            }
          } catch (err: any) {
            console.log("Error >>", err)
            _updateResult.incentivePlan = {
              status: 0,
              error: err.error.reason
            }
          }
          setUpdateResult({ ..._updateResult });
        } else {
          console.log("Incentive 无变化,不需更新");
        }
      }

      // 执行完毕;
      console.log("执行完毕");
      setUpdating(false);
    }
  }, [activeAccount, updateParams, masternodeStorageContract, supernodeStorageContract, multicallContract, supernodeLogicContract, supernodeInfo, sliderVal]);

  const helpToCreate = useCallback(async () => {
    if (updateParams.address && activeAccountChildWallets && activeAccountChildWallets.wallets[updateParams.address]
      && wallet?.path
    ) {
      const nodeAddress = updateParams.address;
      const { path } = activeAccountChildWallets.wallets[nodeAddress];
      const privateKey = await window.electron.wallet.drivePkByPath(wallet.address, path);
      setNodeAddressPrivateKey(privateKey);
    }
    setOpenSSH2CMDTerminalNodeModal(true);
  }, [updateParams, wallet, activeAccountChildWallets]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("wallet_supernodes_sync")}
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>
          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type="secondary">{t("wallet_supernodes_id")}</Text>
            </Col>
            <Col>
              <Text strong>{supernodeInfo?.id}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Text type="secondary">{t("wallet_supernodes_creator")}</Text>
            </Col>
            <Col span={24}>
              {
                supernodeInfo && <AddressComponent address={supernodeInfo?.creator} />
              }
            </Col>
            {
              isNodeCreator && <>
                <Col span={24} style={{ marginTop: "20px" }}>
                  <Text type="secondary">{t("wallet_supernodes_address")}</Text>
                  <Alert style={{ marginTop: "5px", marginBottom: "5px" }} type='warning' showIcon message={<>
                    <Row>
                      <Col span={24}>
                        {t("wallet_supernodes_address_tip0")}
                      </Col>
                      <Col span={24}>
                        {t("wallet_supernodes_address_tip1")},<Text type='danger' strong>{t("wallet_supernodes_address_tip2")}</Text>
                      </Col>
                    </Row>
                  </>} />
                </Col>
                <Col span={24}>
                  {
                    nodeAddressSelectType == NodeAddressSelectType.GEN &&
                    <Radio.Group value={nodeAddressSelectType} disabled={helpResult != undefined}
                      onChange={(event) => {
                        setUpdateParams({
                          ...updateParams,
                          address: supernodeInfo?.addr
                        });
                        setNodeAddressSelectType(event.target.value);
                      }}>
                      <Space style={{ height: "20px" }} direction="vertical">
                        <Radio disabled={wallet?.path == undefined}
                          value={NodeAddressSelectType.GEN}>
                          {t("wallet_supernodes_address_tip3")}
                        </Radio>
                      </Space>
                    </Radio.Group>
                  }
                  {
                    nodeAddressSelectType == NodeAddressSelectType.INPUT &&
                    <>
                      <Alert showIcon type="error" message={<>
                        当前账户没有种子密钥(助记词),无法派生子地址.不可使用辅助功能
                      </>} />
                      <Input style={{ marginTop: "5px" }} value={updateParams?.address} placeholder='输入超级节点地址' disabled={true}
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
                    </>
                  }
                  {
                    nodeAddressSelectType == NodeAddressSelectType.GEN &&
                    <Spin spinning={false}>
                      <Select
                        style={{
                          width: "100%",
                          marginTop: "5px"
                        }}
                        placeholder="正在加载可用的超级节点地址..."
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
                  <Text type="secondary">{t("wallet_supernodes_name")}</Text>
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
                  <Text type="secondary">{t("wallet_supernodes_description")}</Text>
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
                {
                  sliderVal && <>
                    <Divider />
                    <Col span={24}>
                      <Text type='secondary'>{t("wallet_supernodes_incentiveplan")}</Text>
                    </Col>
                    <Col span={24}>
                      <Slider style={{ width: "100%" }}
                        range={{ draggableTrack: true }}
                        value={sliderVal}
                        onChange={(result: number[]) => {
                          const left = result[0];
                          const right = result[1];
                          if (left >= 40 && left <= 50 && right >= 50 && right <= 60 && (right - left) <= 10) {
                            setSliderVal(result)
                          }
                        }}
                      />
                      <Row style={{ width: "100%" }}>
                        <Col span={8} style={{ textAlign: "left" }}>
                          <Text strong>{t("wallet_supernodes_incentiveplan_members")}</Text><br />
                          <Text>{sliderVal[0]} %</Text>
                        </Col>
                        <Col span={8} style={{ textAlign: "center" }}>
                          <Text strong>{t("wallet_supernodes_incentiveplan_creator")}</Text><br />
                          <Text>{sliderVal[1] - sliderVal[0]}%</Text>
                        </Col>
                        <Col span={8} style={{ textAlign: "right" }}>
                          <Text strong>{t("wallet_supernodes_incentiveplan_voters")}</Text><br />
                          <Text>{100 - sliderVal[1]} %</Text>
                        </Col>
                      </Row>
                    </Col>
                  </>
                }
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
                            <Text type="secondary">{t("wallet_supernodes_sync_txhash_address")}</Text><br />
                            <Text strong>{updateResult.address.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.address.status == 0 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_error_address")}</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.address.error.reason}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.enode && <>
                        {
                          updateResult.enode.status == 1 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_txhash_enode")}</Text><br />
                            <Text strong>{updateResult.enode.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.enode.status == 0 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_error_enode")}</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.enode.error.reason}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.name && <>
                        {
                          updateResult.name.status == 1 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_txhash_name")}</Text><br />
                            <Text strong>{updateResult.name.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.name.status == 0 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_error_name")}</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.name.error.reason}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.description && <>
                        {
                          updateResult.description.status == 1 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_txhash_description")}</Text><br />
                            <Text strong>{updateResult.description.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.description.status == 0 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_error_description")}</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.description.error.reason}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    {
                      updateResult.incentivePlan && <>
                        {
                          updateResult.incentivePlan.status == 1 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_txhash_incentivePlan")}</Text><br />
                            <Text strong>{updateResult.incentivePlan.txHash}</Text> <br />
                          </>
                        }
                        {
                          updateResult.incentivePlan.status == 0 && <>
                            <Text type="secondary">{t("wallet_supernodes_sync_error_incentivePlan")}</Text><br />
                            <Text strong type="danger">
                              <CloseCircleTwoTone twoToneColor="red" style={{ marginRight: "5px" }} />
                              {updateResult.incentivePlan.error}
                            </Text> <br />
                          </>
                        }
                      </>
                    }
                    <br />
                    <Text italic>{t("wallet_supernodes_sync_update_tip")}</Text>
                  </>} />
                </>
              }
            </Col>

            <Col span={24} style={{ textAlign: "right" }}>
              {
                !helpResult && isNodeCreator && <>
                  <Button disabled={nodeAddressSelectType != NodeAddressSelectType.GEN} onClick={() => helpToCreate()} type='primary'>{t("next")}</Button>
                </>
              }
              {
                helpResult && helpResult.enode && <>
                  {
                    !needUpdate &&
                    <Alert style={{ textAlign: "left" }} showIcon type="info" message={<>
                      {t("wallet_supernodes_sync_update_notneed")}
                    </>} />
                  }
                  {
                    needUpdate &&
                    <Button disabled={!isNodeCreator || updateResult != undefined} type="primary" onClick={doUpdate} loading={updating}>{t("update")}</Button>
                  }
                </>
              }
              {
                !isNodeCreator && <>
                  <Alert style={{ marginTop: "5px", textAlign: "left" }} type="warning" showIcon message={t("wallet_node_sync_error")} />
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
        isSupernode={true} IP={IP ? IP : undefined}
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

