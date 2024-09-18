
import { Button, Card, Col, Divider, Flex, Modal, Progress, Row, Space, Statistic, Steps, Table, TableProps, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useMulticallContract, useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, formatAvailableSafe3Info, formatLockedSafe3Info, formatSpecialData, formatSpecialSafe3Info, LockedSafe3Info, SpecialSafe3Info } from "../../../structs/Safe3";
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from "../../../state/multicall/CallMulticallAggregate";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { ZERO } from "../../../utils/CurrentAmountUtils";

const { Text, Title } = Typography

export interface Safe3QueryResult {
    address: string,

    lockedNum?: number,
    availableInfo?: AvailableSafe3Info,
    specialInfo?: SpecialSafe3Info,

    lockedAmount?: CurrencyAmount,
    lockedRedeemHeight?: number,
    mnLocked?: LockedSafe3Info
}

export interface Safe3RedeemStatistic {
    addressCount: number,
    totalAvailable: CurrencyAmount,
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
    setSafe3RedeemStatistic: (statistic:Safe3RedeemStatistic) => void,
}) => {
    const safe3Contract = useSafe3Contract();
    const multicallContract = useMulticallContract();
    const [addressResultMap, setAddressResultMap] = useState<{
        [address: string]: Safe3QueryResult
    }>({});
    const [addressFirstQueryMap, setAddressFirstQueryMap] = useState<{
        [address: string]: {
            address: string,

            availableInfo?: AvailableSafe3Info,
            specialInfo?: SpecialSafe3Info,
            lockedNum?: number,

            locked?: {
                [addressIndexOffset: string]: {
                    index: number,
                    offset: number,
                    total?: CurrencyAmount,
                }
            },
            mnLocked?: LockedSafe3Info,
            lockedRedeemHeight?: number,
            lockedAmount?: CurrencyAmount
        }
    }>();
    const [ allFinish , setAllFinish ] = useState<boolean>(false);

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
                            calls.push(getAvailableInfoCall, getLockedNumCall, getSpecialInfoCall);
                            _addressFirstQueryMap[address] = {
                                address,
                            }
                        });
                    CallMulticallAggregate(multicallContract, calls, () => {
                        for (let i = 0; i < calls.length / 3; i++) {
                            const getAvailableInfoCall = calls[i * 3];
                            const getLockedNumCall = calls[i * 3 + 1];
                            const getSpecialInfoCall = calls[i * 3 + 2];
                            const availableInfo = formatAvailableSafe3Info(getAvailableInfoCall.result);
                            const lockedNum = getLockedNumCall.result.toNumber();
                            const specialInfo = formatSpecialSafe3Info(getSpecialInfoCall.result);
                            const address = getAvailableInfoCall.params[0];
                            _addressFirstQueryMap[address] = {
                                ..._addressFirstQueryMap[address],
                                lockedNum,
                                specialInfo,
                                availableInfo
                            }
                        }
                        setAddressFirstQueryMap(_addressFirstQueryMap);
                    });
                }
            } else {
                console.log("ALl Finished!");
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
                                _addressLockedQueryMap[`${address}_${_index}_${_offset}`] = { index: _index, offset: _offset };
                            }
                        }
                    }
                });
            if (Object.keys(_addressLockedQueryMap).length > 0) {
                setAddressLockedQueryMap(_addressLockedQueryMap);
            } else {
                Object.keys(addressFirstQueryMap).forEach(address => {
                    const { lockedNum, locked, availableInfo, specialInfo, mnLocked, lockedRedeemHeight } = addressFirstQueryMap[address];
                    if (lockedNum == 0) {
                        addressFirstQueryMap[address].lockedAmount = ZERO;
                    } else if (locked) {
                        const lockedAmount = Object.keys(locked).map(addressIndexOffset => locked[addressIndexOffset].total)
                            .reduce((_total: CurrencyAmount, current: CurrencyAmount | undefined) => {
                                return _total.add(current ?? ZERO)
                            }, ZERO);
                        addressFirstQueryMap[address].lockedAmount = lockedAmount;
                    }
                    addressResultMap[address] = {
                        ...addressResultMap[address],
                        address,
                        lockedNum,
                        availableInfo,
                        specialInfo,
                        mnLocked,
                        lockedRedeemHeight,
                        lockedAmount: addressFirstQueryMap[address].lockedAmount
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
                            lockedRedeemHeight?: number
                        }
                    } = {};
                    calls.forEach(call => {
                        const [address, index, offset] = call.params;
                        const lockedTxs = call.result.map(formatLockedSafe3Info);
                        let mnLocked = undefined;
                        let lockedRedeemHeight = 0;
                        const total = lockedTxs.reduce((total: CurrencyAmount, current: LockedSafe3Info) => {
                            if (current.isMN) {
                                mnLocked = current;
                            } else {
                                lockedRedeemHeight = current.redeemHeight;
                            }
                            return total.add(current.amount);
                        }, ZERO);
                        _addressLockedQueryResultMap[`${address}_${index}_${offset}`] = { index, offset, total, mnLocked, lockedRedeemHeight }
                    });
                    setAddressLockedQueryMap({
                        ...addressLockedQueryMap,
                        ..._addressLockedQueryResultMap
                    });
                });
            } else {
                if (addressFirstQueryMap) {
                    Object.keys(addressLockedQueryMap).forEach(addressIndexOffset => {
                        const address = addressIndexOffset.split("_")[0];
                        const { index, offset, total, mnLocked, lockedRedeemHeight } = addressLockedQueryMap[addressIndexOffset];
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
                                addressFirstQueryMap[address].locked[addressIndexOffset] = { index, offset, total };
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
            const { availableInfo, lockedAmount, mnLocked } = addressResultMap[address];
            // const hasAvailable = availableInfo?.amount.greaterThan(ZERO)
            // const hasLocked = lockedAmount?.greaterThan(ZERO)
            // const hasMasternode = mnLocked
            // return hasAvailable || hasLocked || hasMasternode;
            return true;
        }).map(address => addressResultMap[address]);
        const needRedeemList = hasAssetList.filter(result => {
            const { availableInfo, lockedAmount, mnLocked, lockedRedeemHeight } = result;
            const needRedeemAvailable = availableInfo?.amount.greaterThan(ZERO)
                && availableInfo.redeemHeight == 0;
            const needRedeemLocked = lockedAmount?.greaterThan(ZERO)
                && lockedRedeemHeight == 0;
            const needRedeemMasternode = mnLocked
                && mnLocked.redeemHeight == 0;
            return needRedeemAvailable || needRedeemLocked || needRedeemMasternode;
        });
        const needRedeemTotalAvailableAmount = needRedeemList.map(result => result.availableInfo?.amount)
            .reduce((total: CurrencyAmount, current: CurrencyAmount | undefined) => { return total.add(current ?? ZERO) }, ZERO);
        const needRedeemTotalLockedAmount = needRedeemList.map(result => result.lockedAmount)
            .reduce((total: CurrencyAmount, current: CurrencyAmount | undefined) => { return total.add(current ?? ZERO) }, ZERO);
        const needRedeemMasternodeCounts = needRedeemList.filter(result => result.mnLocked && result.mnLocked.redeemHeight == 0).length;
        return {
            statistic: {
                needRedeemAddressCount: needRedeemList.length,
                needRedeemTotalAvailableAmount, needRedeemTotalLockedAmount, needRedeemMasternodeCounts,
            },
            percent: {
                value: Math.floor((Object.keys(addressResultMap).length / safe3AddressArr.length) * 100)
            },
            hasAssetList,
            needRedeemList,
        }
    }, [addressResultMap]);

    const nextClick = () => {
        setSafe3RedeemList(hasAssetList);
        setSafe3RedeemStatistic({
            addressCount: needRedeemList.length,
            totalAvailable: statistic.needRedeemTotalAvailableAmount,
            totalLocked: statistic.needRedeemTotalLockedAmount,
            totalMasternodes: statistic.needRedeemMasternodeCounts
        });
    }


    const columns: TableProps<Safe3QueryResult>['columns'] = [
        {
            title: '钱包地址',
            dataIndex: 'address',
            key: 'address',
            render: (text) => <>{text}</>,
            width: "40%"
        },
        {
            title: '可用资产',
            dataIndex: 'address',
            key: 'address0',
            render: (address) => {
                return <> {addressResultMap[address]?.availableInfo?.amount.toExact()} </>
            },
            width: "20%"
        },
        {
            title: '锁仓资产',
            dataIndex: 'address',
            key: 'address1',
            render: (address) => {
                return <> {addressResultMap[address]?.lockedAmount?.toExact()} </>
            },
            width: "20%"
        },
        {
            title: '主节点',
            dataIndex: 'address',
            key: 'address2',
            render: (address) => {
                return <>
                    {addressResultMap[address]?.mnLocked?.amount.toExact()}
                </>
            },
            width: "20%"
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
                        <Statistic value={safe3AddressArr.length} title="解析地址总数" />
                    </Col>
                    <Col span={8}>
                        <Statistic value={statistic.needRedeemAddressCount} title="待迁移资产地址总数" />
                    </Col>
                </Row>
                <Row style={{ marginTop: "10px" }}>
                    <Col span={8}>
                        <Statistic value={statistic.needRedeemTotalAvailableAmount.toFixed(2)} title="待迁移总可用资产" />
                    </Col>
                    <Col span={8}>
                        <Statistic value={statistic.needRedeemTotalLockedAmount.toFixed(2)} title="待迁移总锁仓资产" />
                    </Col>
                    <Col span={8}>
                        <Statistic value={statistic.needRedeemMasternodeCounts} title="待迁移主节点数量" />
                    </Col>
                </Row>
            </Col>
        </Row>
        <Divider />
        <Table loading={!allFinish} columns={columns} dataSource={hasAssetList} />
        <Divider />
        <Button type="primary" disabled={!allFinish} onClick={nextClick}>下一步</Button>
    </>

}

