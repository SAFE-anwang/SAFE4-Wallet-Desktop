
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import Table, { ColumnsType } from 'antd/es/table';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';


const { Title, Text } = Typography;


export default () => {

    return <>
        <Row style={{ height: "50px" }}>
            <Col span={12}>
                <Title level={4} style={{ lineHeight: "16px" }}>
                    领取测试币
                </Title>
            </Col>
        </Row>
        <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{marginBottom:"20px"}}>
            <Alert type='info' showIcon message={<>
                <Text>每个地址每天只能领取 <Text strong>一次</Text> 测试币</Text>
            </>}/>
            <Divider/>
            <Button>点击领取</Button><br /><br />
            <Alert type='error' showIcon message={<>
                今日已领取过测试币,请在次日领取或者新建一个钱包进行领取.
            </>} />
        </Card>
      </div>
    </div>
    </>

}