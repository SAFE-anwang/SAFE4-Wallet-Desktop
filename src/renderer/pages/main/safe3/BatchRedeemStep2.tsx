
import { Alert, Button, Card, Col, Divider, Flex, Modal, Progress, Row, Space, Statistic, Steps, Table, TableProps, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useMulticallContract, useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, formatAvailableSafe3Info, formatLockedSafe3Info, formatSpecialData, formatSpecialSafe3Info, LockedSafe3Info, SpecialSafe3Info } from "../../../structs/Safe3";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ZERO } from "../../../utils/CurrentAmountUtils";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography

export interface Safe3QueryResult {
  address: string,

  lockedNum?: number,
  availableInfo?: AvailableSafe3Info,
  petty?: AvailableSafe3Info,
  specialInfo?: SpecialSafe3Info,

  lockedAmount?: CurrencyAmount,
  lockedRedeemHeight?: number,
  mnLocked?: LockedSafe3Info,

  redeemedCount?: number,
  redeemedAmount?: CurrencyAmount,
  unredeemCount?: number,
  unredeemAmount?: CurrencyAmount
}

export interface Safe3RedeemStatistic {
  addressCount: number,
  totalAvailable: CurrencyAmount,
  totalPetty: CurrencyAmount,
  totalLocked: CurrencyAmount,
  totalMasternodes: number
}

// 每次对多少个地址进行初次遍历;
const MAX_QUERY_ADDRESS_FIRST = 100;
// 构建锁仓分页查询时,每次最多发送多少条数据;一定不能大于10,否则合约会报错;
const MAX_QUERY_LOCKED_OFFSET = 10;
// 每次发送多少个请求去查询某个地址的锁仓(address,index,offset)
const MAX_QUERY_LOCKED_COUNT = 100;

export default ({
  safe3AddressArr,
  setSafe3RedeemList,
  setSafe3RedeemStatistic
}: {
  safe3AddressArr: string[],
  setSafe3RedeemList: (list: Safe3QueryResult[]) => void,
  setSafe3RedeemStatistic: (statistic: Safe3RedeemStatistic) => void,
}) => {

  const { t } = useTranslation();
  const safe3Contract = useSafe3Contract();
  const multicallContract = useMulticallContract();
  const [addressResultMap, setAddressResultMap] = useState<{
    [address: string]: Safe3QueryResult
  }>({});
  const [addressFirstQueryMap, setAddressFirstQueryMap] = useState<{
    [address: string]: {
      address: string,

      availableInfo?: AvailableSafe3Info,
      petty?: AvailableSafe3Info,
      specialInfo?: SpecialSafe3Info,
      lockedNum?: number,

      locked?: {
        [addressIndexOffset: string]: {
          index: number,
          offset: number,
          total?: CurrencyAmount,

          redeemedCount?: number,
          redeemedAmount?: CurrencyAmount,
          unredeemCount?: number,
          unredeemAmount?: CurrencyAmount
        }
      },
      mnLocked?: LockedSafe3Info,
      lockedRedeemHeight?: number,
      lockedAmount?: CurrencyAmount,

      redeemedCount?: number,
      redeemedAmount?: CurrencyAmount,
      unredeemCount?: number,
      unredeemAmount?: CurrencyAmount
    }
  }>();
  const [allFinish, setAllFinish] = useState<boolean>(false);

  // 第一波查询100个地址的可用,锁仓条目数量,和是否主节点
  useEffect(() => {
    if (safe3Contract && multicallContract) {
      if (Object.keys(addressResultMap).length != safe3AddressArr.length) {
        const unsearchs = safe3AddressArr.filter((address) => !addressResultMap[address]);
        if (unsearchs.length > 0) {
          const calls: CallMulticallAggregateContractCall[] = [];
          const _addressFirstQueryMap: {
            [address: string]: Safe3QueryResult
          } = {};
          unsearchs.filter(safe3PrivateKeyAddress => unsearchs.indexOf(safe3PrivateKeyAddress) < MAX_QUERY_ADDRESS_FIRST)
            .forEach((address) => {
              const getAvailableInfoCall: CallMulticallAggregateContractCall = {
                contract: safe3Contract,
                functionName: "getAvailableInfo",
                params: [address]
              };
              const getPettyInfoCall: CallMulticallAggregateContractCall = {
                contract: safe3Contract,
                functionName: "getPettyInfo",
                params: [address]
              };
              const getLockedNumCall: CallMulticallAggregateContractCall = {
                contract: safe3Contract,
                functionName: "getLockedNum",
                params: [address]
              };
              const getSpecialInfoCall: CallMulticallAggregateContractCall = {
                contract: safe3Contract,
                functionName: "getSpecialInfo",
                params: [address]
              };
              calls.push(getAvailableInfoCall, getPettyInfoCall, getLockedNumCall, getSpecialInfoCall);
              _addressFirstQueryMap[address] = {
                address,
              }
            });
          CallMulticallAggregate(multicallContract, calls, () => {
            for (let i = 0; i < calls.length / 4; i++) {
              const getAvailableInfoCall = calls[i * 4];
              const getPettyInfoCall = calls[i * 4 + 1];
              const getLockedNumCall = calls[i * 4 + 2];
              const getSpecialInfoCall = calls[i * 4 + 3];
              const availableInfo = formatAvailableSafe3Info(getAvailableInfoCall.result);
              const petty = formatAvailableSafe3Info(getPettyInfoCall.result);
              const lockedNum = getLockedNumCall.result.toNumber();
              const specialInfo = formatSpecialSafe3Info(getSpecialInfoCall.result);
              const address = getAvailableInfoCall.params[0];
              _addressFirstQueryMap[address] = {
                ..._addressFirstQueryMap[address],
                lockedNum,
                specialInfo,
                availableInfo,
                petty
              }
            }
            setAddressFirstQueryMap(_addressFirstQueryMap);
          });
        }
      } else {
        console.log("ALl Finished! >> ", addressResultMap);
        setAllFinish(true);
      }
    }
  }, [safe3AddressArr, addressResultMap, safe3Contract, multicallContract]);

  // 第二波将需要进行查询的锁仓的地址丢入一个Map
  useEffect(() => {
    if (addressFirstQueryMap) {
      const _addressLockedQueryMap: {
        [address: string]: {
          index: number,
          offset: number,
          total?: CurrencyAmount
        }
      } = {};
      Object.keys(addressFirstQueryMap)
        .forEach(address => {
          const { lockedNum, locked } = addressFirstQueryMap[address];
          if (!locked && lockedNum && lockedNum > 0) {
            if (lockedNum <= MAX_QUERY_LOCKED_OFFSET) {
              _addressLockedQueryMap[`${address}_${0}_${lockedNum}`] = { index: 0, offset: lockedNum };
            } else {
              const steps = Math.ceil(lockedNum / MAX_QUERY_LOCKED_OFFSET);
              for (let i = 0; i < steps; i++) {
                const _index = i * MAX_QUERY_LOCKED_OFFSET;
                const _offset = _index + MAX_QUERY_LOCKED_OFFSET;
                _addressLockedQueryMap[`${address}_${_index}_${MAX_QUERY_LOCKED_OFFSET}`] = { index: _index, offset: MAX_QUERY_LOCKED_OFFSET };
              }
            }
          }
        });
      if (Object.keys(_addressLockedQueryMap).length > 0) {
        setAddressLockedQueryMap(_addressLockedQueryMap);
      } else {
        Object.keys(addressFirstQueryMap).forEach(address => {
          const { lockedNum, locked, availableInfo, petty, specialInfo, mnLocked, lockedRedeemHeight } = addressFirstQueryMap[address];
          if (lockedNum == 0) {
            addressFirstQueryMap[address].lockedAmount = ZERO;
          } else if (locked) {
            const lockedAmount = Object.keys(locked).map(addressIndexOffset => locked[addressIndexOffset].total)
              .reduce((_total: CurrencyAmount, current: CurrencyAmount | undefined) => {
                return _total.add(current ?? ZERO)
              }, ZERO);

            const { unredeemAmount, unredeemCount, redeemedAmount, redeemedCount } = Object.keys(locked)
              .map(addressIndexOffset => locked[addressIndexOffset])
              .reduce((result, data) => {
                const { unredeemAmount, unredeemCount, redeemedAmount, redeemedCount } = data;
                if (unredeemAmount) {
                  result.unredeemAmount = result.unredeemAmount.add(unredeemAmount);
                }
                if (unredeemCount) {
                  result.unredeemCount = result.unredeemCount + unredeemCount;
                }
                if (redeemedAmount) {
                  result.redeemedAmount = result.redeemedAmount.add(redeemedAmount);
                }
                if (redeemedCount) {
                  result.redeemedCount = result.redeemedCount + redeemedCount;
                }
                return result;
              }, { unredeemAmount: ZERO, unredeemCount: 0, redeemedAmount: ZERO, redeemedCount: 0 });

            addressFirstQueryMap[address].lockedAmount = lockedAmount;
            addressFirstQueryMap[address].unredeemAmount = unredeemAmount;
            addressFirstQueryMap[address].unredeemCount = unredeemCount;
            addressFirstQueryMap[address].redeemedAmount = redeemedAmount;
            addressFirstQueryMap[address].redeemedCount = redeemedCount;
          }
          addressResultMap[address] = {
            ...addressResultMap[address],
            address,
            lockedNum,
            availableInfo,
            petty,
            specialInfo,
            mnLocked,
            lockedRedeemHeight,
            lockedAmount: addressFirstQueryMap[address].lockedAmount,
            unredeemAmount: addressFirstQueryMap[address].unredeemAmount,
            unredeemCount: addressFirstQueryMap[address].unredeemCount,
            redeemedAmount: addressFirstQueryMap[address].redeemedAmount,
            redeemedCount: addressFirstQueryMap[address].redeemedCount,
          }
        });
        console.log("Finish Load CurrentFirstAddressResultMap...>", addressFirstQueryMap)
        setAddressResultMap({ ...addressResultMap });
      }
    }
  }, [addressFirstQueryMap]);

  const [addressLockedQueryMap, setAddressLockedQueryMap] = useState<{
    [addressIndexOffset: string]: {
      index: number,
      offset: number,
      total?: CurrencyAmount,
      lockedRedeemHeight?: number,
      mnLocked?: LockedSafe3Info,

      redeemedCount?: number,
      redeemedAmount?: CurrencyAmount,
      unredeemCount?: number,
      unredeemAmount?: CurrencyAmount
    }
  }>();
  // 第三波遍历需要查询锁仓金额的Map;
  useEffect(() => {
    if (addressLockedQueryMap && safe3Contract && multicallContract) {
      const calls: CallMulticallAggregateContractCall[] = [];
      Object.keys(addressLockedQueryMap).forEach((addressIndexOffset) => {
        const { index, offset, total } = addressLockedQueryMap[addressIndexOffset];
        const address = addressIndexOffset.split("_")[0];
        if (!total && calls.length < MAX_QUERY_LOCKED_COUNT) {
          calls.push({
            contract: safe3Contract,
            functionName: "getLockedInfo",
            params: [address, index, offset]
          });
        }
      });
      if (calls.length > 0) {
        CallMulticallAggregate(multicallContract, calls, () => {
          const _addressLockedQueryResultMap: {
            [address: string]: {
              index: number,
              offset: number,
              total?: CurrencyAmount,
              mnLocked?: LockedSafe3Info,
              lockedRedeemHeight?: number,

              redeemedCount?: number,
              redeemedAmount?: CurrencyAmount,
              unredeemCount?: number,
              unredeemAmount?: CurrencyAmount
            }
          } = {};
          calls.forEach(call => {
            const [address, index, offset] = call.params;
            const lockedTxs = call.result.map(formatLockedSafe3Info);
            let mnLocked = undefined;
            let lockedRedeemHeight = 0;

            let unredeemCount = 0;
            let unredeemAmount = ZERO;
            let redeemedCount = 0;
            let redeemedAmount = ZERO;

            const total = lockedTxs.reduce((total: CurrencyAmount, current: LockedSafe3Info) => {
              if (current.isMN) {
                mnLocked = current;
              } else {
                const { amount, redeemHeight } = current;
                if (redeemHeight == 0) {
                  unredeemCount = unredeemCount + 1;
                  unredeemAmount = unredeemAmount.add(amount);
                } else {
                  redeemedCount = redeemedCount + 1;
                  redeemedAmount = redeemedAmount.add(amount);
                }
              }
              return total.add(current.amount);
            }, ZERO);
            _addressLockedQueryResultMap[`${address}_${index}_${offset}`] = { index, offset, total, mnLocked, lockedRedeemHeight, unredeemCount, unredeemAmount, redeemedCount, redeemedAmount }
          });
          setAddressLockedQueryMap({
            ...addressLockedQueryMap,
            ..._addressLockedQueryResultMap
          });
        }, (err) => { console.log("Error ::", err) });
      } else {
        if (addressFirstQueryMap) {
          Object.keys(addressLockedQueryMap).forEach(addressIndexOffset => {
            const address = addressIndexOffset.split("_")[0];
            const { index, offset, total, mnLocked, lockedRedeemHeight,
              unredeemCount, unredeemAmount, redeemedCount, redeemedAmount
            } = addressLockedQueryMap[addressIndexOffset];
            if (addressFirstQueryMap[address]) {
              if (!addressFirstQueryMap[address].mnLocked) {
                addressFirstQueryMap[address].mnLocked = mnLocked;
              }
              if (addressFirstQueryMap[address].lockedRedeemHeight == undefined) {
                addressFirstQueryMap[address].lockedRedeemHeight = lockedRedeemHeight;
              }
              if (!addressFirstQueryMap[address].locked) {
                addressFirstQueryMap[address].locked = {};
              }
              if (addressFirstQueryMap[address].locked) {
                addressFirstQueryMap[address].locked[addressIndexOffset] = { index, offset, total, unredeemCount, unredeemAmount, redeemedCount, redeemedAmount };
              }
            }
            console.log("Finish load each LockedTxInfos...>", addressLockedQueryMap)
            setAddressLockedQueryMap(undefined);
            setAddressFirstQueryMap({ ...addressFirstQueryMap });
          });
        }
      }
    }
  }, [addressLockedQueryMap, safe3Contract, multicallContract]);

  const { hasAssetList, needRedeemList, statistic, percent } = useMemo(() => {
    // 过滤有资产的数据需要进行显示;
    const hasAssetList = Object.keys(addressResultMap).filter(address => {
      const { availableInfo, lockedAmount, mnLocked, petty } = addressResultMap[address];
      const hasAvailable = availableInfo?.amount.greaterThan(ZERO)
      const hasPetty = petty?.amount.greaterThan(ZERO)
      const hasLocked = lockedAmount?.greaterThan(ZERO)
      const hasMasternode = mnLocked
      return hasAvailable || hasLocked || hasMasternode || hasPetty;
    }).map(address => addressResultMap[address]);

    const needRedeemList = hasAssetList.filter(result => {
      const { availableInfo, mnLocked, unredeemCount, petty } = result;
      const needRedeemAvailable = availableInfo?.amount.greaterThan(ZERO)
        && availableInfo.redeemHeight == 0;
      let needRedeemLocked = unredeemCount && unredeemCount > 0;
      const needRedeemMasternode = mnLocked
        && mnLocked.redeemHeight == 0;
      const needRedeemPetty = petty?.amount.greaterThan(ZERO)
        && petty.redeemHeight == 0;
      return needRedeemAvailable || needRedeemLocked || needRedeemMasternode || needRedeemPetty;
    });

    const needRedeemTotalAvailableAmount = needRedeemList
      .filter((result) => { return result.availableInfo?.redeemHeight == 0 })
      .map(result => result.availableInfo?.amount)
      .reduce((total: CurrencyAmount, current: CurrencyAmount | undefined) => { return total.add(current ?? ZERO) }, ZERO);

    const needRedeemTotalPettyAmount = needRedeemList
      .filter((result) => { return result.petty?.redeemHeight == 0 })
      .map(result => result.petty?.amount)
      .reduce((total: CurrencyAmount, current: CurrencyAmount | undefined) => { return total.add(current ?? ZERO) }, ZERO);

    const needRedeemTotalLockedAmount = needRedeemList
      .map(result => {
        const mnLocked = result.mnLocked;
        if (mnLocked) {
          if (mnLocked.redeemHeight == 0) {
            return result.unredeemAmount?.add(mnLocked.amount);
          }
        }
        return result.unredeemAmount;
      })
      .reduce((total: CurrencyAmount, current: CurrencyAmount | undefined) => { return total.add(current ?? ZERO) }, ZERO);

    const needRedeemMasternodeCounts = needRedeemList.filter(result => result.mnLocked && result.mnLocked.redeemHeight == 0).length;

    return {
      statistic: {
        needRedeemAddressCount: needRedeemList.length,
        needRedeemTotalAvailableAmount, needRedeemTotalLockedAmount, needRedeemMasternodeCounts, needRedeemTotalPettyAmount
      },
      percent: {
        value: Math.floor((Object.keys(addressResultMap).length / safe3AddressArr.length) * 100)
      },
      hasAssetList,
      needRedeemList,
    }
  }, [addressResultMap]);

  const nextClick = () => {
    setSafe3RedeemList(needRedeemList);
    setSafe3RedeemStatistic({
      addressCount: needRedeemList.length,
      totalAvailable: statistic.needRedeemTotalAvailableAmount,
      totalLocked: statistic.needRedeemTotalLockedAmount,
      totalMasternodes: statistic.needRedeemMasternodeCounts,
      totalPetty: statistic.needRedeemTotalPettyAmount
    });
  }


  const columns: TableProps<Safe3QueryResult>['columns'] = [
    {
      title: t("wallet_redeems_batch_col_address"),
      dataIndex: 'address',
      key: 'address',
      render: (text) => <>{text}</>,
      width: "40%"
    },
    {
      title: t("wallet_redeems_batch_col_available"),
      dataIndex: 'address',
      key: 'address0',
      render: (address) => {
        const availableInfo = addressResultMap[address]?.availableInfo;
        const needRedeemAvailable = availableInfo?.amount.greaterThan(ZERO) && availableInfo.redeemHeight == 0;
        return <>
          {
            !needRedeemAvailable && <>
              <Text type="secondary" delete>
                {availableInfo?.amount.toExact()} SAFE
              </Text>
            </>
          }
          {
            needRedeemAvailable && <>
              <Text strong>
                {availableInfo?.amount.toExact()} SAFE
              </Text>
            </>
          }
        </>
      },
      width: "15%"
    },
    {
      title: t("wallet_redeems_batch_col_locked"),
      dataIndex: 'address',
      key: 'address1',
      render: (address) => {
        const lockedAmount = addressResultMap[address]?.lockedAmount;
        const lockedRedeemHeight = addressResultMap[address]?.lockedRedeemHeight;
        const mnLocked = addressResultMap[address]?.mnLocked;
        const redeemedAmount = addressResultMap[address]?.redeemedAmount;
        const redeemedCount = addressResultMap[address]?.redeemedCount;
        const unredeemAmount = addressResultMap[address]?.unredeemAmount;
        const unredeemCount = addressResultMap[address]?.unredeemCount;


        let needLockedRedeem = false;
        if (lockedAmount) {
          if (mnLocked) {
            if (lockedAmount.greaterThan(mnLocked.amount)) {
              needLockedRedeem = (unredeemCount && unredeemCount > 0) ? true : false;
            } else {
              needLockedRedeem = false;
            }
          } else {
            needLockedRedeem = (unredeemCount && unredeemCount > 0) ? true : false;
          }
        }
        return <>
          {
            !needLockedRedeem && <>
              <Text type="secondary" delete>
                {lockedAmount?.toExact()} SAFE
              </Text>
            </>
          }

          {
            needLockedRedeem && <>
              <Row>
                <Col span={24}>
                  <Text type="secondary">全部锁仓:</Text>
                  <Text strong>
                    {lockedAmount?.toExact()} SAFE
                  </Text>
                </Col>
                {
                  unredeemAmount && redeemedAmount && unredeemAmount.greaterThan(ZERO) && redeemedAmount.greaterThan(ZERO) &&
                  <>
                    <Col span={24}>
                      <Text type="secondary">未迁移:</Text>
                      <Text strong>
                        {
                          unredeemAmount?.toExact()
                        } SAFE
                        - {unredeemCount}
                      </Text>
                    </Col>
                    <Col span={24}>
                      <Text type="secondary">已迁移:</Text>
                      <Text strong>
                        {
                          redeemedAmount?.toExact()
                        } SAFE
                        - {redeemedCount}
                      </Text>
                    </Col>
                  </>
                }
              </Row>
            </>
          }
        </>
      },
      width: "15%"
    },
    {
      title: t("wallet_redeems_batch_col_masternode"),
      dataIndex: 'address',
      key: 'address2',
      render: (address) => {
        const mnLocked = addressResultMap[address]?.mnLocked;
        const mnRedeemHeight = mnLocked?.redeemHeight;
        return <>
          {
            mnRedeemHeight != 0 && mnLocked?.amount && <>
              <Text type="secondary" delete>
                {mnLocked.amount.toExact()} SAFE
              </Text>
            </>
          }
          {
            mnRedeemHeight == 0 && mnLocked?.amount && <>
              <Text strong>
                {mnLocked.amount.toExact()} SAFE
              </Text>
            </>
          }
        </>
      },
      width: "15%"
    },
    {
      title: t("wallet_redeems_batch_col_petty"),
      dataIndex: 'address',
      key: 'address0',
      render: (address) => {
        const petty = addressResultMap[address]?.petty;
        const needRedeemPetty = petty?.amount.greaterThan(ZERO) && petty.redeemHeight == 0;
        return <>
          {
            !needRedeemPetty && <>
              <Text type="secondary" delete>
                {petty?.amount.toExact()} SAFE
              </Text>
            </>
          }
          {
            needRedeemPetty && <>
              <Text strong>
                {petty?.amount.toExact()} SAFE
              </Text>
            </>
          }
        </>
      },
      width: "15%"
    },
  ];


  return <>
    <Row style={{ marginTop: "20px" }}>
      <Col span={8} style={{ textAlign: "center" }}>
        <Flex vertical gap="small">
          <Flex vertical gap="small">
            <Progress percent={percent.value} type="circle" />
          </Flex>
        </Flex>
      </Col>
      <Col span={16}>
        <Row>
          <Col span={8}>
            {/* 加载解析地址总数 */}
            <Statistic value={safe3AddressArr.length} title={t("wallet_redeems_batch_totalparseaddrcount")} />
          </Col>
          <Col span={8}>
            {/* 待迁移资产地址总数 */}
            <Statistic value={statistic.needRedeemAddressCount} title={t("wallet_redeems_batch_totalwaitaddrcount")} />
          </Col>
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <Col span={6}>
            <Statistic value={statistic.needRedeemTotalAvailableAmount.toFixed(2)} title={t("wallet_redeems_batch_totalwaitavailable")} />
          </Col>
          <Col span={6}>
            <Statistic value={statistic.needRedeemTotalLockedAmount.toFixed(2)} title={t("wallet_redeems_batch_totalwaitlocked")} />
          </Col>
          <Col span={6}>
            <Statistic value={statistic.needRedeemMasternodeCounts} title={t("wallet_redeems_batch_totalwaitmasternode")} />
          </Col>
          <Col span={6}>
            <Statistic value={statistic.needRedeemTotalPettyAmount.toFixed(2)} title={t("wallet_redeems_batch_totalwaitpetty")} />
          </Col>
        </Row>
      </Col>
    </Row>
    <Divider />
    <Table loading={!allFinish} columns={columns} dataSource={hasAssetList} />
    <Divider />
    {
      allFinish && needRedeemList.length == 0 &&
      <Alert style={{ marginBottom: "20px" }} type="warning" showIcon message={<>
        {t("wallet_redeems_batch_none")}
      </>} />
    }
    <Button type="primary" disabled={!allFinish || needRedeemList.length == 0} onClick={nextClick}>下一步</Button>
  </>

}

