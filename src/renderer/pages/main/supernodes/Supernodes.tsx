
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Table } from 'antd';
import { ColumnsType, ColumnType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';

const { Title, Text, Paragraph } = Typography;



export default () => {

    const supernodeStorageContract = useSupernodeStorageContract();
    const [supernodeInfos , setSupernodeInfos] = useState<SupernodeInfo[]>([]);

    const columns : ColumnsType<SupernodeInfo> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render : ( id , supernodeInfo : SupernodeInfo ) => {
                return <>{id}</>
            }
        },
        {
            title: '地址',
            dataIndex: 'addr',
            key: 'addr',
            render : ( addr , supernodeInfo : SupernodeInfo ) => {
                return <>{addr}</>
            }
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render : ( name , supernodeInfo : SupernodeInfo ) => {
                return <>{name}</>
            }
        },
        {
            title: '状态',
            dataIndex: 'stateInfo',
            key: 'stateInfo',
            render : ( stateInfo , supernodeInfo : SupernodeInfo ) => {
                return <>{supernodeInfo.stateInfo.state}</>
            }
        },
    ];

    useEffect(() => {
        if (supernodeStorageContract) {
            supernodeStorageContract.callStatic.getAll()
                .then(_supernodeInfos => {
                    const supernodeInfos = _supernodeInfos.map(formatSupernodeInfo)
                    setSupernodeInfos(supernodeInfos)
                }).catch(err => {

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
        <div style={{ width: "100%", paddingTop: "40px" }}>
            <div style={{ margin: "auto", width: "90%" }}>
                <Table dataSource={supernodeInfos} columns={columns} size="large" pagination={{total:supernodeInfos.length,pageSize:5}} />
            </div>
        </div>
    </>
}