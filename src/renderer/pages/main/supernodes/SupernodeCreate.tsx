import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Input, Slider } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords } from '../../../state/wallets/hooks';
import { EmptyContract } from '../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../structs/Supernode';
import VoteModalConfirm from './Vote/VoteModal-Confirm';
import { AccountRecord } from '../../../structs/AccountManager';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

export default () => {

    const navigate = useNavigate();

    const [createParams, setCreateParams] = useState<{
        name: string,
        ename: string,
        description: string,
        inventivePlan: {
            creator: number,
            partner: number,
            voter: number
        }
    }>();
    const [sliderVal, setSliderVal] = useState<number[]>([45, 55])

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
                            <Text type='secondary'>名称</Text>
                            <Input></Input>
                        </Col>
                    </Row>
                    <Divider />
                    <Row>
                        <Text type='secondary'>ENODE</Text>
                        <Input></Input>
                    </Row>
                    <Divider />
                    <Row>
                        <Text type='secondary'>描述</Text>
                        <Input></Input>
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
                                if (left >= 40 && left <= 50 && right >= 50 && right <= 60) {
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
                                <Text>{sliderVal[1] - sliderVal[0]} %</Text>
                            </Col>
                            <Col span={8} style={{ textAlign: "right" }}>
                                <Text strong>投票人</Text><br />
                                <Text>{100 - sliderVal[1]} %</Text>
                            </Col>
                        </Row>
                    </Row>
                    <Divider />
                    <Row style={{ width: "100%", textAlign: "right" }}>
                        <Col span={24}>
                            <Button type="primary">下一步</Button>
                        </Col>
                    </Row>
                </div>

            </Card>
        </Row>

    </>

}