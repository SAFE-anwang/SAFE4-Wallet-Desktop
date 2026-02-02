import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Input, Slider, Alert, Radio, Space, Spin, Select } from 'antd';
import { useEffect, useState } from 'react';
import { LeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveWallet } from '../../../../state/wallets/hooks';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../../hooks/useContracts';
import RegisterModalConfirm from './RegisterModal-Confirm';
import NumberFormat from '../../../../utils/NumberFormat';
import { Safe4_Business_Config } from '../../../../config';
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from '../../../../state/multicall/CallMulticallAggregate';
import useAddrNodeInfo from '../../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';
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

  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const multicallContract = useMulticallContract();
  const [openRegisterModal, setOpenRegsterModal] = useState<boolean>(false);
  const [enodeTips, setEnodeTips] = useState<boolean>(false);
  const wallet = useWalletsActiveWallet();
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

  const nextClick = async () => {
    const { enode, description, incentivePlan, address } = registerParams;
    incentivePlan.creator = sliderVal;
    incentivePlan.partner = 100 - sliderVal;
    if (!enode) {
      inputErrors.enode = t("please_enter") + t("wallet_masternodes_enode");
    } else {
      const enodeRegex = /^enode:\/\/[0-9a-fA-F]{128}@(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/;
      const isMatch = enodeRegex.test(enode);
      if (!isMatch) {
        inputErrors.enode = t("enter_correct") + t("wallet_masternodes_enode");
      }
    }
    if (!address) {
      inputErrors.address = t("please_enter") + t("wallet_masternodes_address");
    } else {
      if (!ethers.utils.isAddress(address)) {
        inputErrors.address = t("enter_correct") + t("wallet_masternodes_address");
      }
    }
    if (!description) {
      inputErrors.description = t("please_enter") + t("wallet_masternodes_description")
    };
    if (description && (description.length < InputRules.description.min || description.length > InputRules.description.max)) {
      inputErrors.description = t("wallet_masternodes_description_lengthrule", { min: InputRules.description.min, max: InputRules.description.max })
    }
    if (registerParams.registerType == Masternode_Create_Type_NoUnion
      && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther(
        Safe4_Business_Config.Masternode.Create.LockAmount + ""
      ))))) {
      inputErrors.balance = t("wallet_masternodes_notenoughtocreate");
    }
    if (registerParams.registerType == Masternode_create_type_Union
      && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther(
        Safe4_Business_Config.Masternode.Create.UnionLockAmount + ""
      ))))) {
      inputErrors.balance = t("wallet_masternodes_notenoughtocreate");
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
      const isValidEncodeCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "isValidEnode",
        params: [enode]
      };
      const getIDsByEnodeCall: CallMulticallAggregateContractCall = {
        contract: masternodeStorageContract,
        functionName: "getIDsByEnode",
        params: [enode]
      };
      const enodeExistInSupernodesCall: CallMulticallAggregateContractCall = {
        contract: supernodeStorageContract,
        functionName: "existEnode",
        params: [enode]
      }
      CallMulticallAggregate(multicallContract, [
        addrExistCall, addrIsFounderCall, addrExistInSupernodesCall, addrIsSupernodeFounderCall,
        isValidEncodeCall, getIDsByEnodeCall, enodeExistInSupernodesCall
      ], () => {
        const addrExistsInMasternodes: boolean = addrExistCall.result;
        const addrExistsInSupernodes: boolean = addrExistInSupernodesCall.result;
        const isValidEncode: boolean = isValidEncodeCall.result;
        const getIDsByEnode: number[] = getIDsByEnodeCall.result;
        const enodeExistsInSupernodes: boolean = enodeExistInSupernodesCall.result;
        const addrIsFounder: boolean = addrIsFounderCall.result;
        const addrIsSupernodeFounder: boolean = addrExistInSupernodesCall.result;
        setChecking(false);
        if (addrExistsInMasternodes || addrExistsInSupernodes) {
          if (addrExistsInMasternodes) {
            inputErrors.address = t("wallet_masternodes_address_isnodeaddress");
          }
          if (addrExistsInSupernodes) {
            inputErrors.address = t("wallet_masternodes_address_isnodeaddress");
          }
          setInputErrors({ ...inputErrors });
          return;
        }
        if (addrIsFounder || addrIsSupernodeFounder) {
          if (addrIsFounder) {
            inputErrors.address = t("wallet_masternodes_address_joinnode");
          }
          if (addrIsSupernodeFounder) {
            inputErrors.address = t("wallet_masternodes_address_joinnode");
          }
          setInputErrors({ ...inputErrors });
          return;
        }
        if (!isValidEncode) {
          if (enodeExistsInSupernodes) {
            inputErrors.enode = t("wallet_masternodes_enodeexistinsupernode");
          } else if (getIDsByEnode.length >= 0) {
            inputErrors.enode = t("wallet_masternodes_enodegelimits", { count: getIDsByEnode.length });
          } else {
            inputErrors.enode = t("wallet_masternodes_enodeisinvalid");
          }
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
  }, [wallet]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/masternodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_masternodes_create")}
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto", marginTop: "20px" }}>
          <Row>
            <Col span={24}>
              <Text type='secondary'>{t("wallet_masternodes_create_mode")}</Text><br />
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
                  <Radio value={1}>{t("wallet_masternodes_create_mode_single")}</Radio>
                  <Radio value={2}>{t("wallet_masternodes_create_mode_join")}</Radio>
                </Space>
              </Radio.Group>
            </Col>
          </Row>
          <br />
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text type='secondary'>{t("wallet_lock")}</Text><br />
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
              <Text type='secondary'>{t("wallet_balance_currentavailable")}</Text><br />
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
            <Text type='secondary'>{t("wallet_masternodes_address")}</Text>
            <Col span={24}>
              <Input value={registerParams.address} style={{ marginTop: "5px" }} placeholder={t("enter") + t("wallet_masternodes_address")} onChange={(event) => {
                const input = event.target.value.trim();
                setRegisterParams({
                  ...registerParams,
                  address: input
                });
                setInputErrors({
                  ...inputErrors,
                  address: undefined
                });
              }} />
              {
                inputErrors && inputErrors.address &&
                <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.address} showIcon></Alert>
              }
            </Col>
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <QuestionCircleOutlined onClick={() => setEnodeTips(true)} style={{ cursor: "pointer", marginRight: "5px" }} /><Text type='secondary'>ENODE</Text>
            </Col>
            {
              enodeTips && <Col span={24} style={{ marginBottom: "10px", marginTop: "5px" }}>
                <Alert type='info' message={<>
                  <Text>{t("wallet_masternodes_enode_gettip0")}</Text><br />
                  <Text strong code>admin.nodeInfo</Text><br />
                  {t("wallet_masternodes_enode_gettip1")}
                </>} />
              </Col>
            }
            <Input.TextArea style={{ height: "100px" }} status={inputErrors.enode ? "error" : ""}
              value={registerParams.enode} placeholder={t("enter") + t("wallet_masternodes_enode")} onChange={(event) => {
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
            <Text type='secondary'>{t("wallet_masternodes_description")}</Text>
            <Input.TextArea style={{ height: "100px" }} status={inputErrors.description ? "error" : ""}
              value={registerParams.description} placeholder={t("enter") + t("wallet_masternodes_description")} onChange={(event) => {
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
                <Text type='secondary'>{t("wallet_supernodes_incentiveplan")}</Text>
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
                    <Text strong>{t("wallet_supernodes_incentiveplan_creator")}</Text><br />
                    <Text>{sliderVal} %</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: "right" }}>
                    <Text strong>{t("wallet_supernodes_incentiveplan_members")}</Text><br />
                    <Text>{100 - sliderVal} %</Text>
                  </Col>
                </Row>
              </Row>
              <Divider />
            </>
          }

          <Row style={{ width: "100%", textAlign: "right" }}>
            <Col span={24}>
              {
                activeAccountNodeInfo?.isNode && <div style={{ textAlign: "left", marginBottom: "20px" }}>
                  <Alert type='warning' showIcon message={<>
                    {`当前账户已经是${activeAccountNodeInfo.isMN ? '主节点' : '超级节点'},不可再创建节点`}
                  </>} />
                </div>
              }
              <Button disabled={activeAccountNodeInfo?.isNode} loading={checking} type="primary" onClick={() => {
                nextClick();
              }}>{t("next")}</Button>
            </Col>
          </Row>
        </div>
      </Card>
    </Row>
    <RegisterModalConfirm openRegisterModal={openRegisterModal} setOpenRegisterModal={setOpenRegsterModal} registerParams={registerParams} />
  </>

}
