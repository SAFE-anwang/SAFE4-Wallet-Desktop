
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useMasternodeLogicContract, useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, SpecialSafe3Info, formatAvailableSafe3Info, formatLockedSafe3Info, formatSpecialSafe3Info } from "../../../structs/Safe3";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { CurrencyAmount } from "@uniswap/sdk";
import { fetchSafe3Address } from "../../../services/safe3";
import { ethers } from "ethers";
import useSafeScan from "../../../hooks/useSafeScan";

const { Text } = Typography;
const LockedTxLimit = 10;

export interface Safe3Asset {
  safe3Address: string
  availableSafe3Info: AvailableSafe3Info,
  locked: {
    lockedNum: number,
    lockedAmount: CurrencyAmount,
    redeemHeight: number,
    txLockedAmount: CurrencyAmount
  },
  masternode?: {
    redeemHeight: number,
    lockedAmount: CurrencyAmount
  }
}

export default ({
  safe3Address, setSafe3Asset
}: {
  safe3Address?: string,
  setSafe3Asset: (safe3Asset?: Safe3Asset) => void
}) => {

  const safe3Contract = useSafe3Contract();
  const masternodeStorageContract = useMasternodeLogicContract();
  const [safe3AddressAsset, setSafe3AddressAsset] = useState<Safe3Asset>();
  const [safe3AddressAssetLoading, setSafe3AddressAssetLoading] = useState<boolean>(false);
  const {API} = useSafeScan();

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
  }, [safe3Address, safe3Contract]);

  const loadSafe3Asset = useCallback((address: string, callback: (safe3Asset: Safe3Asset) => void) => {
    if (safe3Contract && masternodeStorageContract) {
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
              redeemHeight: 0,
              txLockedAmount: ZERO
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
                      masternode?: {
                        redeemHeight: number,
                        lockedAmount: CurrencyAmount
                      }
                    } = {
                      redeemHeight: 0
                    };
                    const totalLockedAmount = lockedSafe3Infos.map(lockTx => {
                      if (lockTx.isMN) {
                        loopResult.masternode = {
                          redeemHeight: lockTx.redeemHeight,
                          lockedAmount: lockTx.amount
                        }
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
                        lockedAmount: totalLockedAmount,
                        txLockedAmount: loopResult.masternode ? totalLockedAmount.subtract(loopResult.masternode.lockedAmount) : totalLockedAmount
                      }
                      if (loopResult.masternode) {
                        _safe3Asset.masternode = {
                          redeemHeight: loopResult.masternode.redeemHeight,
                          lockedAmount: loopResult.masternode.lockedAmount
                        }
                      }
                      callback(_safe3Asset);
                    } else {
                      // 如果锁仓数据过于多,则通过浏览器接口来获取锁仓以及是否为主节点.
                      // 查询区块链浏览器接口获取它是否是主节点.
                      fetchSafe3Address( API , address).then(data => {
                        const { masternode, locked, mLockedAmount } = data;
                        const isMasternode = masternode;
                        const lockedAmount = CurrencyAmount.ether(ethers.utils.parseEther(locked).toBigInt());
                        const masternodeLockedAmount = CurrencyAmount.ether(ethers.utils.parseEther(mLockedAmount).toBigInt());
                        const txLockedAmount = lockedAmount.subtract(masternodeLockedAmount);
                        _safe3Asset.locked = {
                          redeemHeight: loopResult.redeemHeight,
                          lockedNum,
                          lockedAmount,
                          txLockedAmount
                        }
                        if (isMasternode) {
                          // 如何检查它是否已经迁移了主节点 ??
                          // 1.> 如果在第一页的遍历结果中已经出现了主节点的锁仓记录，则直接用它的结果就可以了.
                          // 2.> 如果是需要查询浏览器接口获取是否为主节点的情况,不好判断是否迁移过主节点,则先简单的从masternodes中检测这个地址是不是主节点.
                          if (loopResult.masternode) {
                            _safe3Asset.masternode = {
                              redeemHeight: loopResult.masternode.redeemHeight,
                              lockedAmount: loopResult.masternode.lockedAmount
                            }
                          } else {
                            // for 2
                            masternodeStorageContract.callStatic.exist(address)
                              .then((exist: boolean) => {
                                _safe3Asset.masternode = {
                                  redeemHeight: exist ? 1 : 0,
                                  lockedAmount: masternodeLockedAmount
                                }
                                callback(_safe3Asset);
                                return;
                              });
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
  }, [safe3Contract, masternodeStorageContract]);

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
  }, [safe3AddressAsset]);

  return (<>
    <Col span={12}>
      {
        safe3Address && <>
          <Spin spinning={safe3AddressAssetLoading}>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">账户余额</Text><br />
            </Col>
            <Col span={24}>
              <Text strong delete={
                safe3AddressAsset && safe3AddressAsset.availableSafe3Info && safe3AddressAsset.availableSafe3Info.redeemHeight > 0
              }>{safe3AddressAsset?.availableSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">锁仓余额</Text>
              <Divider type="vertical" />
              <Text type="secondary">(锁仓记录:{safe3AddressAsset?.locked?.lockedNum})</Text>
            </Col>
            <Col span={24}>
              <Text delete={
                safe3AddressAsset && safe3AddressAsset?.locked.redeemHeight > 0
              } strong>{safe3AddressAsset?.locked.lockedAmount.toFixed(2)} SAFE</Text><br />
            </Col>
            {
              safe3AddressAsset?.masternode && <>
                <Col span={24} style={{ marginTop: "5px" }}>
                  <Text strong type="secondary">主节点</Text><br />
                </Col>
                <Text strong delete={
                  safe3AddressAsset.masternode.redeemHeight > 0
                }>
                  {safe3AddressAsset.masternode.lockedAmount.toFixed(2)} SAFE
                </Text>
              </>
            }
          </Spin>
        </>
      }
    </Col>

  </>)

}
