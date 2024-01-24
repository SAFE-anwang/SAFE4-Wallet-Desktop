import { Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { MemberInfo } from "../../structs/Supernode"
import AddressView from "./AddressView";

const { Text } = Typography;

export default ({
    memberInfos
}: {
    memberInfos: MemberInfo[]
}) => {
    const columns: ColumnsType<MemberInfo> = [
        {
            title: '锁仓记录ID',
            dataIndex: 'lockID',
            key: 'lockID',
            render: (lockID) => {
                return <>{lockID}</>
            }
        },
        {
            title: '地址',
            dataIndex: 'addr',
            key: 'addr',
            render: (addr) => {
                return <>
                    <AddressView address={addr}></AddressView>
                </>
            }
        },
        {
            title: '数量',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => {
                return <Text strong>{amount.toFixed(6)} SAFE</Text>
            }
        },
    ];
    return <>
        <Table dataSource={memberInfos} columns={columns} />
    </>
}