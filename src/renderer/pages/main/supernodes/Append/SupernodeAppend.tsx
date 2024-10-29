
import { Typography, Row, Col, Button, Card, Divider, Space, Input, Slider, InputNumber, Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useETHBalances, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { useSelector } from 'react-redux';
import { AppState } from '../../../../state';
import { useSupernodeStorageContract } from '../../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../../structs/Supernode';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import AppendModalConfirm from './AppendModal-Confirm';
import Supernode from '../Supernode';
import { Safe4_Business_Config } from '../../../../config';
import useAddrNodeInfo from '../../../../hooks/useAddrIsNode';

const { Text, Title } = Typography;

export default () => {
  const navigate = useNavigate();
  const supernodeAddr = useSelector<AppState, string | undefined>(state => state.application.control.vote);
  const supernodeStorageContract = useSupernodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);

  useEffect(() => {
    if (supernodeAddr && supernodeStorageContract) {
      // function getInfo(address _addr) external view returns (SuperNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(supernodeAddr)
        .then(_supernodeInfo => setSupernodeInfo(formatSupernodeInfo(_supernodeInfo)))
        .catch(err => {

        })
    }
  }, [supernodeAddr]);
  useEffect(() => {
    setNotEnoughError(undefined);
  }, [activeAccount]);

  const [params, setParams] = useState<{
    min: number,
    step: number,
    left: number,
    value: number
  }>();
  const [notEnoughError, setNotEnoughError] = useState<string | undefined>();
  const [openAppendModal, setOpenAppendModal] = useState<boolean>(false);

  useEffect(() => {
    if (supernodeInfo) {
      const totalAmount = supernodeInfo.founders.reduce<CurrencyAmount>(
        (totalAmount, founder) => totalAmount = totalAmount.add(founder.amount),
        CurrencyAmount.ether(JSBI.BigInt(0))
      )
      const left = Safe4_Business_Config.Supernode.Create.LockAmount - Number(totalAmount.toFixed(0));
      if (left < Safe4_Business_Config.Supernode.Create.UnionLockAmount / 2) {
        setParams({
          step: 0,
          min: left,
          left,
          value: left
        })
      } else {
        setParams({
          step: Safe4_Business_Config.Supernode.Create.UnionLockAmount / 2,
          min: Safe4_Business_Config.Supernode.Create.UnionLockAmount / 2,
          left,
          value: Safe4_Business_Config.Supernode.Create.UnionLockAmount / 2
        })
      }
    }
  }, [supernodeInfo]);

  const nextClick = () => {
    if (params && params.value) {
      const notEnough = !balance?.greaterThan(CurrencyAmount.ether(ethers.utils.parseEther(params.value + "").toBigInt()))
      if (notEnough) {
        setNotEnoughError("账户内没有足够的SAFE进行锁仓!");
        return;
      }
      setOpenAppendModal(true);
    }
  }

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          超级节点联合创立
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Card title="通过锁仓SAFE来成为这个超级节点的合伙人" style={{ width: "100%" }}>
            <>
              <Row>
                <Col span={24}>
                  <Text type="secondary">超级节点剩余份额</Text>
                </Col>
                <Col span={24}>
                  <Text style={{ fontSize: "20px" }} strong>{params?.left} SAFE</Text>
                </Col>
              </Row>
              <Divider />
              <Row >
                <Col span={10}>
                  <Text strong>数量</Text>
                  <br />
                  <Text style={{ fontSize: "20px" }} strong>{params?.value} SAFE</Text>
                  {
                    params && params.step > 0 && <Slider
                      step={params.step}
                      defaultValue={params.value}
                      max={params.left}
                      value={params.value}
                      onChange={(val) => {
                        if (!(val < params.min)) {
                          setNotEnoughError(undefined);
                          setParams({
                            ...params,
                            value: val
                          })
                        }
                      }}
                    />
                  }
                  <br />
                  {
                    notEnoughError && <Alert showIcon type='error' message={notEnoughError} />
                  }
                </Col>
                <Col span={14}>
                  <Text type='secondary' style={{ float: "right" }} strong>账户余额</Text>
                  <br />
                  <Text style={{ float: "right", fontSize: "20px", lineHeight: "36px" }}>
                    {balance?.toFixed(6)} SAFE
                  </Text>
                </Col>
              </Row>
              <Divider />
              <Spin spinning={activeAccountNodeInfo == undefined}>
                <Button disabled={activeAccountNodeInfo == undefined || activeAccountNodeInfo.isNode} type='primary' onClick={nextClick}>
                  成为合伙人
                </Button>
                {
                  activeAccountNodeInfo && activeAccountNodeInfo.isNode && <Alert type='warning' showIcon message={<>
                    {
                      activeAccountNodeInfo.isMN && "已经是主节点"
                    }
                    {
                      activeAccountNodeInfo.isSN && "已经是超级节点"
                    }
                  </>} />
                }

              </Spin>
            </>
          </Card>
        </Row>

        <Row>
          {
            supernodeInfo && <Supernode supernodeInfo={supernodeInfo} />
          }
        </Row>

      </div>
    </div>

    {
      supernodeInfo && params?.value && <AppendModalConfirm openAppendModal={openAppendModal} setOpenAppendModal={setOpenAppendModal}
        supernodeInfo={supernodeInfo}
        valueAmount={params?.value}
      />
    }

  </>

}
