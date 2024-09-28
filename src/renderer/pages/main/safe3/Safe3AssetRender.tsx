
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useMasternodeLogicContract, useMulticallContract, useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, formatAvailableSafe3Info, formatLockedSafe3Info, LockedSafe3Info } from "../../../structs/Safe3";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { CurrencyAmount } from "@uniswap/sdk";
import { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../state/multicall/CallMulticallAggregate";

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
  const multicallContract = useMulticallContract();
  const [safe3AddressAsset, setSafe3AddressAsset] = useState<Safe3Asset>();
  const [safe3AddressAssetLoading, setSafe3AddressAssetLoading] = useState<boolean>(false);

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

  const loadSafe3Asset = useCallback(async (address: string, callback: (safe3Asset: Safe3Asset) => void) => {
    if (safe3Contract && masternodeStorageContract && multicallContract) {
      // 查询地址的可用资产信息
      const availableSafe3Info = formatAvailableSafe3Info(await safe3Contract.callStatic.getAvailableInfo(address));
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
      setSafe3AddressAsset({
        ..._safe3Asset
      });

      const lockedNum = (await safe3Contract.callStatic.getLockedNum(address)).toNumber();
      const lockedPage = Math.ceil(lockedNum / LockedTxLimit);
      const lockedPageCalls = [];
      for (let i = 0; i < lockedPage; i++) {
        const pageQueryCall: CallMulticallAggregateContractCall = {
          contract: safe3Contract,
          functionName: "getLockedInfo",
          params: [address, i * LockedTxLimit, LockedTxLimit]
        }
        lockedPageCalls.push(pageQueryCall);
      }
      const aggregateTimes = Math.ceil(lockedPageCalls.length / LockedTxLimit);
      const lockedSafe3Infos: LockedSafe3Info[] = [];
      for (let i = 0; i < aggregateTimes; i++) {
        const from = i * LockedTxLimit;
        const to = from + LockedTxLimit;
        const calls = lockedPageCalls.filter((_, index) => index >= from && index < to)
        await SyncCallMulticallAggregate(multicallContract, calls);
        calls.map(call => {
          call.result.map(formatLockedSafe3Info)
            .forEach((lockedSafe3Info: LockedSafe3Info) => lockedSafe3Infos.push(lockedSafe3Info));
          // setTempUpdate .... //
          const tempTotal = lockedSafe3Infos.map(lockTx => lockTx.amount).reduce((total, amount) => {
            total = total.add(amount);
            return total;
          }, ZERO);
          _safe3Asset.locked.lockedNum = lockedSafe3Infos.length;
          _safe3Asset.locked.lockedAmount = tempTotal;
          setSafe3AddressAsset({
            ..._safe3Asset,
          });
          // setTempUpdate .... //
        });
      }
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
    }
  }, [safe3Contract, masternodeStorageContract, multicallContract]);

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
