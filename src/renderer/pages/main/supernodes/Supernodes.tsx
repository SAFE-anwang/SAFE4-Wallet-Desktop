
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Table, Badge, Button } from 'antd';
import { ColumnsType, ColumnType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import AddressView from '../../components/AddressView';
import { useDispatch } from 'react-redux';
import { applicationControlVoteSupernode } from '../../../state/application/action';

const { Title, Text, Paragraph } = Typography;

export default () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const supernodeStorageContract = useSupernodeStorageContract();
    const [supernodeInfos, setSupernodeInfos] = useState<(SupernodeInfo)[]>([]);
    const [totalVotedAmount, setTotalVotedAmount] = useState<CurrencyAmount>();

    const RenderNodeState = (state: number) => {
        switch (state) {
            case 1:
                return <Badge status="processing" text="在线" />
            default:
                return <Badge status="default" text="未知" />
        }
    }

    const columns: ColumnsType<SupernodeInfo> = [
        {
            title: '排名',
            dataIndex: 'id',
            key: '_id',
            render: (id, supernodeInfo: SupernodeInfo) => {
                const { state } = supernodeInfo.stateInfo;
                return <>
                    <Row>
                        <Col>
                            <Text strong>{supernodeInfos.indexOf(supernodeInfo) + 1}</Text>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Text>{RenderNodeState(state)}</Text>
                        </Col>
                    </Row>
                </>
            },
            width:"50px"
        },
        {
            title: '得票数',
            dataIndex: 'id',
            key: '_id',
            render: (_, supernodeInfo: SupernodeInfo) => {
                let percent = 0;
                const totalVotedSafeAmount = supernodeInfo.voteInfo.voters.reduce<CurrencyAmount>(
                    (totalVotedSafeAmount, memberInfo) => totalVotedSafeAmount.add(memberInfo.amount),
                    CurrencyAmount.ether(JSBI.BigInt(0))
                );
                if (totalVotedAmount && totalVotedAmount.greaterThan(JSBI.BigInt(0))) {
                    percent = Number(
                        supernodeInfo.voteInfo.totalAmount.divide(totalVotedAmount).multiply(JSBI.BigInt(100)).toFixed(1)
                    )
                }
                return <>
                    <Row>
                        <Col span={12} style={{ textAlign: "left" }}>
                            <Text strong>{supernodeInfo.voteInfo.totalAmount.toFixed(2)}</Text>
                        </Col>
                        <Col span={12} style={{ textAlign: "right" }}>
                            <Text type='secondary'>[{totalVotedSafeAmount.toFixed(2)} SAFE]</Text>
                        </Col>
                    </Row>
                    <Row>
                        <Progress percent={percent} status={"normal"} />
                    </Row>
                </>
            },
            width: "180px"
        },

        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (name, supernodeInfo: SupernodeInfo) => {
                return <>
                    <Row>
                        <Col>
                            <Text title={name} strong style={{ width: "150px" }} ellipsis>
                                {name}
                            </Text>
                        </Col>
                    </Row>
                    <Row >
                        <Col span={24}>
                            <Text title={supernodeInfo.description} type='secondary' style={{ width: "150px" }} ellipsis>
                                {supernodeInfo.description}
                            </Text>
                        </Col>
                    </Row>
                </>
            },
            width:"180px"
        },
        {
            title: '超级节点',
            dataIndex: 'addr',
            key: 'addr',
            render: (addr, supernodeInfo: SupernodeInfo) => {
                const _addr = addr.substring(0, 8) + "...." + addr.substring(addr.length - 6);
                return <>
                    <Row>
                        <Col span={4}>
                            <Text type='secondary'>地址:</Text>
                        </Col>
                        <Col span={20}>
                            <Text strong>
                                <AddressView address={_addr}></AddressView>
                            </Text>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={4}>
                            <Text type='secondary'>ID:</Text>
                        </Col>
                        <Col span={20}>
                            <Text>{supernodeInfo.id}</Text>
                            <Button size='small' type='primary' style={{ float: "right" }} onClick={() => {
                                dispatch(applicationControlVoteSupernode(supernodeInfo.addr));
                                navigate("/main/supernodes/vote");
                            }}>投票</Button>
                        </Col>
                    </Row>
                </>
            },
            width:"200px"
        },
    ];

    useEffect(() => {
        if (supernodeStorageContract) {
            supernodeStorageContract.callStatic.getAll()
                .then(_supernodeInfos => {
                    console.log("_supernodeInfos", _supernodeInfos)
                    const supernodeInfos: SupernodeInfo[] = _supernodeInfos.map(formatSupernodeInfo);
                    supernodeInfos.sort((s1, s2) => s2.voteInfo.totalAmount.greaterThan(s1.voteInfo.totalAmount) ? 1 : -1)
                    // 计算每个超级节点内创建时抵押的 SAFE 数量.
                    supernodeInfos.forEach((supernode: SupernodeInfo) => {
                        const totalFoundersAmount = supernode.founders.reduce<CurrencyAmount>(
                            (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
                            CurrencyAmount.ether(JSBI.BigInt("0"))
                        );
                    });
                    // 计算当前网络投票的所有投票价值.
                    const totalVotedAmount = supernodeInfos.reduce<CurrencyAmount>(
                        (totalVotedAmount, supernodeInfo) => totalVotedAmount.add(supernodeInfo.voteInfo.totalAmount),
                        CurrencyAmount.ether(JSBI.BigInt("0"))
                    );
                    console.log("totalVotedAmount ==>", totalVotedAmount.toFixed(2));
                    setTotalVotedAmount(totalVotedAmount);
                    setSupernodeInfos(supernodeInfos);
                }).catch(err => {
                    console.log("err ==>", err)
                });
        }
    }, [supernodeStorageContract])

    return <>
        <Row style={{ height: "50px" }}>
            <Col span={12}>
                <Title level={4} style={{ lineHeight: "16px" }}>
                    超级节点
                </Title>
            </Col>
        </Row>
        <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
            <div style={{ margin: "auto", width: "90%" }}>
                <Table dataSource={supernodeInfos} columns={columns} size="large" pagination={{ total: supernodeInfos.length, pageSize: 10 }} />
            </div>
        </div>
    </>
}
