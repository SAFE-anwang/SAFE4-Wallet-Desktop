import { MasternodeInfo } from "../../../structs/Masternode"
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Card, Divider, TabsProps, Tabs } from 'antd';
import AddressView from '../../components/AddressView';
import Members from '../../components/Members';
import { RenderNodeState } from "../supernodes/Supernodes";

const { Text } = Typography;

export default ({
    masternodeInfo
}: {
    masternodeInfo: MasternodeInfo
}) => {

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: <>
                创建人 <Divider type='vertical' /> 合伙人
            </>,
            children: <Members memberInfos={masternodeInfo.founders} />,
        },
    ];

    return <>
        <Card title="主节点详情" style={{ width: "100%", marginTop: "50px" }}>
            <Row>
                <Col span={16}>
                    <Row>
                        <Col span={6}>
                            <Text type='secondary'>节点ID:</Text>
                        </Col>
                        <Col span={18}>
                            <Text strong>{masternodeInfo.id}</Text>
                        </Col>
                    </Row>
                    <Row style={{ marginTop: "5px" }}>
                        <Col span={6}>
                            <Text type='secondary'>节点状态:</Text>
                        </Col>
                        <Col span={18}>
                            <Text strong>{RenderNodeState(masternodeInfo.state)}</Text>
                        </Col>
                    </Row>
                    <Row style={{ marginTop: "5px" }}>
                        <Col span={6}>
                            <Text type='secondary'>节点地址:</Text>
                        </Col>
                        <Col span={18}>
                            <Text strong><AddressView address={masternodeInfo.addr} /></Text>
                        </Col>
                    </Row>
                    <Row style={{ marginTop: "5px" }}>
                        <Col span={6}>
                            <Text type='secondary'>创建者:</Text>
                        </Col>
                        <Col span={18}>
                            <Text strong><AddressView address={masternodeInfo.creator} /></Text>

                        </Col>
                    </Row>
                </Col>
                <Col span={8}>
                    <Text type='secondary'>挖矿奖励分配:</Text><br /><br />
                    <Row>
                        <Col span={10}>
                            <Text strong>创建者 {masternodeInfo.incentivePlan.creator}%</Text>
                        </Col>
                        <Col span={14}>
                            <Progress percent={masternodeInfo.incentivePlan.creator} showInfo={false} />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={10}>
                            <Text strong>合伙人 {masternodeInfo.incentivePlan.partner}%</Text>
                        </Col>
                        <Col span={14}>
                            <Progress percent={masternodeInfo.incentivePlan.partner} showInfo={false} />
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row style={{ marginTop: "5px" }}>
                <Col span={4}>
                    <Text type='secondary'>创建质押:</Text>
                </Col>
                <Col span={20}>
                    <Text strong>
                        {
                            masternodeInfo.founders.reduce<CurrencyAmount>(
                                (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
                                CurrencyAmount.ether(JSBI.BigInt("0"))
                            ).toFixed(6)
                        } SAFE
                    </Text>
                </Col>
            </Row>
            <Row style={{ marginTop: "5px" }}>
                <Col span={4}>
                    <Text type='secondary'>节点ENODE:</Text>
                </Col>
                <Col span={20}>
                    <Text strong>{masternodeInfo.enode}</Text>
                </Col>
            </Row>
            <Row style={{ marginTop: "5px" }}>
                <Col span={4}>
                    <Text type='secondary'>节点描述:</Text>
                </Col>
                <Col span={20}>
                    <Text strong>{masternodeInfo.description}</Text>
                </Col>
            </Row>
            <Divider />
            <Tabs defaultActiveKey="1" items={items} />
        </Card>
    </>

}