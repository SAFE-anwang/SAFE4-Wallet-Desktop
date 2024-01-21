
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Table, Badge, Button } from 'antd';
import { ColumnsType, ColumnType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import AddressView from '../../components/AddressView';

const { Title, Text, Paragraph } = Typography;

export default () => {

    return <>
        <Row style={{ height: "50px" }}>
            <Col span={12}>
                <Title level={4} style={{ lineHeight: "16px" }}>
                    超级节点
                </Title>
            </Col>
        </Row>
    </>

}