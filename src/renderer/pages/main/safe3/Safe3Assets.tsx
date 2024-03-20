
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, SpecialSafe3Info, formatAvailableSafe3Info, formatLockedSafe3Info, formatSpecialSafe3Info } from "../../../structs/Safe3";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { CurrencyAmount } from "@uniswap/sdk";
import { fetchSafe3Address } from "../../../services/safe3";
import { ethers } from "ethers";
import { CheckCircleTwoTone, CheckSquareTwoTone } from '@ant-design/icons';

const { Text } = Typography;

const LockedTxLimit = 10;

export interface Safe3Asset {
  safe3Address: string
  availableSafe3Info: AvailableSafe3Info,
  locked: {
    lockedNum: number,
    lockedAmount: CurrencyAmount,
    redeemHeight: number,
  },
  masternode?: {
    redeemHeight: number
  }
}

export default ({
  safe3Address, safe3CompressAddress, setSafe3Asset
}: {

  safe3Address?: string,
  safe3CompressAddress?: string,
  setSafe3Asset: (safe3Asset?: Safe3Asset) => void

}) => {
  const safe3Contract = useSafe3Contract();
  const [safe3AddressAsset, setSafe3AddressAsset] = useState<Safe3Asset>();
  const [safe3CompressAddressAsset, setSafe3CompressAddressAsset] = useState<Safe3Asset>();
  const [safe3AddressAssetLoading, setSafe3AddressAssetLoading] = useState<boolean>(false);
  const [safe3CompressAddressAssetLoading, setSafe3CompressAddressAssetLoading] = useState<boolean>(false);
  useEffect(() => {
    setSafe3Asset(undefined);
    if (safe3Address && safe3Contract) {
      setSafe3AddressAssetLoading(true);
      loadSafe3Asset(safe3Address, (safe3Asset: Safe3Asset) => {
        setSafe3AddressAsset({
          ...safe3Asset
        })
        setSafe3AddressAssetLoading(false);
      });
    } else {
      setSafe3AddressAsset(undefined);
    }

    if (safe3CompressAddress && safe3Contract) {
      setSafe3CompressAddressAssetLoading(true);
      loadSafe3Asset(safe3CompressAddress, (safe3Asset: Safe3Asset) => {
        setSafe3CompressAddressAsset({
          ...safe3Asset
        })
        setSafe3CompressAddressAssetLoading(false);
      });
    } else {
      setSafe3CompressAddressAsset(undefined);
    }

  }, [safe3Address, safe3Contract, safe3CompressAddress]);

  const loadSafe3Asset = useCallback((address: string, callback: (safe3Asset: Safe3Asset) => void) => {
    if (safe3Contract) {
      // 查询地址的可用资产信息
      safe3Contract.callStatic.getAvailableInfo(address)
        .then(data => {
          const availableSafe3Info = formatAvailableSafe3Info(data);
          const _safe3Asset: Safe3Asset = {
            safe3Address: address,
            availableSafe3Info,
            locked: {
              lockedNum: 0,
              lockedAmount: ZERO,
              redeemHeight: 0
            }
          }
          // 查询地址的锁仓数据.
          safe3Contract.callStatic.getLockedNum(address)
            .then((data: any) => {
              const lockedNum = data.toNumber();
              if (lockedNum > 0) {
                safe3Contract.callStatic.getLockedInfo(address, 0, LockedTxLimit)
                  .then((_lockedSafe3Infos: any[]) => {
                    const lockedSafe3Infos = _lockedSafe3Infos.map(formatLockedSafe3Info);
                    const loopResult: {
                      redeemHeight: number,
                      mRedeemHeight?: number
                    } = {
                      redeemHeight: 0
                    };
                    const totalLockedAmount = lockedSafe3Infos.map(lockTx => {
                      if (lockTx.isMN) {
                        loopResult.mRedeemHeight = lockTx.redeemHeight;
                        console.log(lockTx)
                      } else {
                        loopResult.redeemHeight = lockTx.redeemHeight;
                      }
                      return lockTx.amount;
                    }).reduce((total, amount) => {
                      total = total.add(amount);
                      return total;
                    }, ZERO);
                    if (lockedNum <= LockedTxLimit) {
                      // 如果锁仓数据不多,则直接在一次调用合约中进行统计.
                      _safe3Asset.locked = {
                        redeemHeight: loopResult.redeemHeight,
                        lockedNum,
                        lockedAmount: totalLockedAmount
                      }
                      if (loopResult.mRedeemHeight != undefined) {
                        _safe3Asset.masternode = {
                          redeemHeight: loopResult.mRedeemHeight
                        }
                      }
                      callback(_safe3Asset);
                    } else {
                      // 如果锁仓数据过于多,则通过浏览器接口来获取锁仓以及是否为主节点.
                      // 查询区块链浏览器接口获取它是否是主节点.
                      fetchSafe3Address(address).then(data => {
                        const { masternode, locked } = data;
                        const isMasternode = masternode;
                        const lockedAmount = CurrencyAmount.ether(ethers.utils.parseEther(locked).toBigInt());
                        _safe3Asset.locked = {
                          redeemHeight: loopResult.redeemHeight,
                          lockedNum,
                          lockedAmount
                        }
                        if (isMasternode) {
                          // 如何检查它是否已经迁移了主节点 ??
                          // 1.> 如果在第一页的遍历结果中已经出现了主节点的锁仓记录，则直接用它的结果就可以了.
                          // 2.> 如果没有，则尝试使用估算gas的方式来验证是否可以进行主节点迁移.如果可以.则表明它是主节点且可以进行迁移.
                          // 3.> 如果估算报错，根据错误来判断，它是不是主节点，以及是否迁移了.
                          if (loopResult.mRedeemHeight != undefined) {
                            _safe3Asset.masternode = {
                              redeemHeight: loopResult.mRedeemHeight
                            }
                          } else {

                          }
                        }
                        callback(_safe3Asset);
                      });
                    }
                  });
              } else {
                callback(_safe3Asset);
              }
            })
        })
    }
  }, [safe3Contract]);

  useEffect(() => {
    if (safe3AddressAsset) {
      if (safe3AddressAsset.availableSafe3Info?.amount && safe3AddressAsset.availableSafe3Info?.amount.greaterThan(ZERO)) {
        setSafe3Asset(safe3AddressAsset);
        return;
      }
      if (safe3AddressAsset.locked && safe3AddressAsset.locked.lockedNum && safe3AddressAsset.locked.lockedNum > 0) {
        setSafe3Asset(safe3AddressAsset);
        return;
      }
      setSafe3Asset(safe3AddressAsset);
    }
    if (safe3CompressAddressAsset) {
      if (safe3CompressAddressAsset.availableSafe3Info?.amount && safe3CompressAddressAsset.availableSafe3Info?.amount.greaterThan(ZERO)) {
        setSafe3Asset(safe3CompressAddressAsset);
        return;
      }
      if (safe3CompressAddressAsset.locked && safe3CompressAddressAsset.locked.lockedNum && safe3CompressAddressAsset.locked.lockedNum > 0) {
        setSafe3Asset(safe3CompressAddressAsset);
        return;
      }
    }
  }, [safe3AddressAsset, safe3CompressAddressAsset]);

  return (<>
    <Col span={12}>
      <Col span={24}>
        <Text strong type="secondary">Safe3 钱包地址</Text><br />
      </Col>
      <Col span={24}>
        <Text strong>{safe3Address}</Text><br />
      </Col>
      {
        safe3Address && <>
          <Spin spinning={safe3AddressAssetLoading}>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">账户余额</Text><br />
            </Col>
            <Col span={24}>
              <Text strong>{safe3AddressAsset?.availableSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">锁仓余额</Text>
              <Divider type="vertical" />
              <Text type="secondary">(锁仓记录:{safe3AddressAsset?.locked?.lockedNum})</Text>
            </Col>
            <Col span={24}>
              <Text strong>{safe3AddressAsset?.locked.lockedAmount.toFixed(2)} SAFE</Text><br />
            </Col>
            {
              safe3AddressAsset?.masternode && <>
                <Col span={24} style={{ marginTop: "5px" }}>

                </Col>
              </>
            }
          </Spin>
        </>
      }
    </Col>

    <Col span={12}>
      <Col span={24}>
        <Text strong type="secondary">Safe3 钱包地址[压缩公钥]</Text><br />
      </Col>
      <Col span={24}>
        <Text strong>{safe3CompressAddress}</Text><br />
      </Col>
      {
        safe3CompressAddress && <>
          <Spin spinning={safe3CompressAddressAssetLoading}>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">账户余额</Text><br />
            </Col>
            <Col span={24}>
              <Text strong delete={
                safe3CompressAddressAsset && safe3CompressAddressAsset.availableSafe3Info && safe3CompressAddressAsset.availableSafe3Info.redeemHeight > 0
              }>{safe3CompressAddressAsset?.availableSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">锁仓余额</Text>
              <Divider type="vertical" />
              <Text type="secondary">(锁仓记录:{safe3CompressAddressAsset?.locked?.lockedNum})</Text>
            </Col>
            <Col span={24}>
              <Text delete={
                safe3CompressAddressAsset && safe3CompressAddressAsset?.locked.redeemHeight > 0
              }>
                <Text strong>{safe3CompressAddressAsset?.locked?.lockedAmount?.toFixed(2)} SAFE</Text><br />
              </Text>
            </Col>
            {
              safe3CompressAddressAsset?.masternode && <>
                <Col span={24} style={{ marginTop: "5px" }}>
                  {
                    safe3CompressAddressAsset.masternode.redeemHeight == 0 && <>
                      <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: "5px" }} />
                      <Text strong>主节点</Text>
                    </>
                  }
                  {
                    safe3CompressAddressAsset.masternode.redeemHeight != 0 && <>
                      <CheckSquareTwoTone twoToneColor="#dfdfdf" style={{ marginRight: "5px" }} />
                      <Text type="secondary" delete>主节点</Text>
                    </>
                  }
                </Col>
              </>
            }
          </Spin>
        </>
      }
    </Col>
  </>)

}
