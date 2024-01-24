import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Input, Slider, Alert, Radio, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords, useETHBalances, useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { EmptyContract } from '../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../structs/Supernode';
import VoteModalConfirm from './Vote/VoteModal-Confirm';
import { AccountRecord } from '../../../structs/AccountManager';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Currency, CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import CreateModalConfirm from './Create/CreateModal-Confirm';
import type { RadioChangeEvent } from 'antd';
const { Text, Title } = Typography;

export const Supernode_Create_Type_NoUnion = 1;
export const Supernode_create_type_Union = 2;

export default () => {

  const navigate = useNavigate();
  const supernodeStorageContract = useSupernodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];

  const [createParams, setCreateParams] = useState<{
    createType: number | 1,
    name: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    incentivePlan: {
      creator: number,
      partner: number,
      voter: number
    }
  }>({
    createType: Supernode_Create_Type_NoUnion,
    name: undefined,
    enode: undefined,
    description: undefined,
    incentivePlan: {
      creator: 10,
      partner: 45,
      voter: 45
    }
  });
  const [sliderVal, setSliderVal] = useState<number[]>([45, 55]);
  const [inputErrors, setInputErrors] = useState<{
    name: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    balance: string | undefined
  }>({
    name: undefined,
    enode: undefined,
    description: undefined,
    balance: undefined
  });

  const nextClick = async () => {
    const { name, enode, description, incentivePlan } = createParams;
    incentivePlan.partner = sliderVal[0];
    incentivePlan.creator = sliderVal[1] - sliderVal[0];
    incentivePlan.voter = 100 - sliderVal[1];
    if (!name) {
      inputErrors.name = "请输入超级节点名称!";
    };
    if (!enode) {
      inputErrors.enode = "请输入超级节点ENODE!";
    };
    if (!description) {
      inputErrors.description = "请输入超级节点简介信息!"
    };
    if ( createParams.createType == Supernode_Create_Type_NoUnion
        && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther("2"))))) {
      inputErrors.balance = "账户余额不足以支付超级节点创建费用";
    }
    if ( createParams.createType == Supernode_create_type_Union
        && !balance?.greaterThan(CurrencyAmount.ether(JSBI.BigInt(ethers.utils.parseEther("1"))))) {
      inputErrors.balance = "账户余额不足以支付超级节点创建费用";
    }
    if (inputErrors.name || inputErrors.enode || inputErrors.description || inputErrors.balance) {
      setInputErrors({ ...inputErrors });
      return;
    }
    if (supernodeStorageContract) {
      /**
       * function existName(string memory _name) external view returns (bool);
       * function existEnode(string memory _enode) external view returns (bool);
       */
      const nameExists = await supernodeStorageContract.callStatic.existName(name);
      const enodeExists = await supernodeStorageContract.callStatic.existEnode(enode);
      if (nameExists) {
        inputErrors.name = "该名称已被使用";
      }
      if (enodeExists) {
        inputErrors.enode = "该ENODE已被使用";
      }
      if (nameExists || enodeExists) {
        setInputErrors({ ...inputErrors });
        return;
      }
      setOpenCreateModal(true);
    }
  }
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          创建超级节点
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
                  balance : undefined
                })
                setCreateParams({
                  ...createParams,
                  createType: e.target.value
                })
              }} value={createParams.createType}>
                <Space direction="horizontal">
                  <Radio value={1}>独立</Radio>
                  <Radio value={2}>众筹</Radio>
                </Space>
              </Radio.Group>
            </Col>
          </Row>
          <Divider />
          <Row>
            <Col span={24}>
              <Text type='secondary'>名称</Text>
              <Input status={inputErrors.name ? "error" : ""}
                value={createParams.name} placeholder='输入超级节点名称' onChange={(event) => {
                  const inputName = event.target.value;
                  setInputErrors({
                    ...inputErrors,
                    name: undefined
                  })
                  setCreateParams({
                    ...createParams,
                    name: inputName
                  });
                }}></Input>
              {
                inputErrors && inputErrors.name &&
                <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.name} showIcon></Alert>
              }
            </Col>
          </Row>
          <Divider />
          <Row>
            <Text type='secondary'>ENODE</Text>
            <Input.TextArea status={inputErrors.enode ? "error" : ""}
              value={createParams.enode} placeholder='输入超级节点ENODE' onChange={(event) => {
                const inputEnode = event.target.value;
                setInputErrors({
                  ...inputErrors,
                  enode: undefined
                })
                setCreateParams({
                  ...createParams,
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
            <Input status={inputErrors.description ? "error" : ""}
              value={createParams.description} placeholder='请输入超级节点简介信息' onChange={(event) => {
                const inputDescription = event.target.value;
                setInputErrors({
                  ...inputErrors,
                  description: undefined
                })
                setCreateParams({
                  ...createParams,
                  description: inputDescription
                })
              }}></Input>
            {
              inputErrors && inputErrors.description &&
              <Alert style={{ marginTop: "5px" }} type='error' message={inputErrors.description} showIcon></Alert>
            }
          </Row>
          <Divider />
          <Row>
            <Text type='secondary'>挖矿奖励分配方案</Text>
            <br />
            <Slider style={{ width: "100%" }}
              range={{ draggableTrack: true }}
              value={sliderVal}
              onChange={(result: number[]) => {
                const left = result[0];
                const right = result[1];
                if (left >= 40 && left <= 50 && right >= 50 && right <= 60 && (right-left) <= 10 ) {
                  setSliderVal(result)
                }
              }}
            />
            <br />
            <Row style={{ width: "100%" }}>
              <Col span={8} style={{ textAlign: "left" }}>
                <Text strong>股东</Text><br />
                <Text>{sliderVal[0]} %</Text>
              </Col>
              <Col span={8} style={{ textAlign: "center" }}>
                <Text strong>创建者</Text><br />
                <Text>{sliderVal[1] - sliderVal[0]}%</Text>
              </Col>
              <Col span={8} style={{ textAlign: "right" }}>
                <Text strong>投票人</Text><br />
                <Text>{100 - sliderVal[1]} %</Text>
              </Col>
            </Row>
          </Row>
          <Divider />
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text type='secondary'>锁仓</Text><br />
              {
                createParams.createType == Supernode_Create_Type_NoUnion &&
                <Text strong>5,000 SAFE</Text>
              }
               {
                createParams.createType == Supernode_create_type_Union &&
                <Text strong>1,000 SAFE</Text>
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
          <Row style={{ width: "100%", textAlign: "right" }}>
            <Col span={24}>
              <Button type="primary" onClick={() => {
                nextClick();
              }}>下一步</Button>
            </Col>
          </Row>
        </div>
      </Card>
    </Row>

    {
      createParams.name && createParams.enode && createParams.description &&
      <CreateModalConfirm openCreateModal={openCreateModal} setOpenCreateModal={setOpenCreateModal} createParams={createParams} />
    }



  </>

}
