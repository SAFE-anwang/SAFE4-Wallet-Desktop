import { Avatar, List, Typography, } from "antd";
import { LoadingOutlined, LockOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({
    from, to, value, status
}: {
    from: string | undefined,
    to: string | undefined,
    value: string | undefined,
    status: number | undefined
}) => {

    return <>
        <TransactionElementTemplate
            icon={<LockOutlined style={{ color: "black" }} />}
            title="锁仓"
            status={status}
            description={to}
            assetFlow={<>
                <Text type="secondary" strong>
                    <LockOutlined style={{ marginRight: "5px" }} />
                    {value && EtherAmount({ raw: value, fix: 18 })} SAFE
                </Text>
            </>}
        />

    </>
}
