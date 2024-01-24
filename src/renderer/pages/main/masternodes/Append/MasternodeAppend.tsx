
import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Space, Input, Slider, InputNumber, Alert } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { AppState } from '../../../../state';
import { useMasternodeStorageContract } from '../../../../hooks/useContracts';
import { useETHBalances, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { MasternodeInfo, formatMasternode } from '../../../../structs/Masternode';
import AppendModalConfirm from './AppendModal-Confirm';

const { Text, Title } = Typography;

export default () => {

  const navigate = useNavigate();
  const masternodeAppend = useSelector<AppState, string | undefined>(state => state.application.control.masternodeAppend);
  const masternodeStorageContract = useMasternodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const balance = useETHBalances([activeAccount])[activeAccount];
  const [masternodeInfo, setMasternodeInfo] = useState<MasternodeInfo>();

  useEffect(() => {
    if (masternodeAppend && masternodeStorageContract) {
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      masternodeStorageContract.callStatic.getInfo(masternodeAppend)
        .then(_masternodeInfo => setMasternodeInfo(formatMasternode(_masternodeInfo)))
        .catch(err => {

        })
    }
  }, [masternodeAppend, masternodeStorageContract]);

  useEffect(() => {
    setNotEnoughError(undefined);
  }, [activeAccount])

  const [params, setParams] = useState<{
    min: number,
    step: number,
    left: number,
    value: number
  }>();
  const [notEnoughError, setNotEnoughError] = useState<string | undefined>();
  const [openAppendModal, setOpenAppendModal] = useState<boolean>(false);

  useEffect(() => {
    if (masternodeInfo) {
      const totalAmount = masternodeInfo.founders.reduce<CurrencyAmount>(
        (totalAmount, founder) => totalAmount = totalAmount.add(founder.amount),
        CurrencyAmount.ether(JSBI.BigInt(0))
      )
      const left = 1000 - Number(totalAmount.toFixed(0));
      if (left < 200) {
        setParams({
          step: 0,
          min: left,
          left,
          value: left
        })
      } else {
        setParams({
          step: 50,
          min: 200,
          left,
          value: 200
        })
      }
    }
  }, [masternodeInfo]);

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
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/masternodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          主节点联合创建
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Card title="通过锁仓SAFE来成为这个主节点的股东" style={{ width: "100%" }}>
            <>
              <Row>
                <Col span={24}>
                  <Text type="secondary">主节点剩余份额</Text>
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
              <Button type='primary' onClick={nextClick}>
                成为股东
              </Button>
            </>
          </Card>
        </Row>

        <Row>
          <Card title="超级节点详情" style={{ width: "100%", marginTop: "50px" }}>
            {masternodeInfo?.addr}
          </Card>
        </Row>

      </div>
    </div>

    {
      masternodeInfo && params?.value && <AppendModalConfirm openAppendModal={openAppendModal} setOpenAppendModal={setOpenAppendModal}
        masternodeInfo={masternodeInfo}
        valueAmount={params?.value}
      />
    }

  </>

}
