import { Typography, } from "antd";
import { LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({
    from, to, value, status , isUnion
}: {
    from: string | undefined,
    to: string | undefined,
    value: string | undefined,
    status: number | undefined ,
    isUnion : boolean
}) => {

    return <>
        <TransactionElementTemplate
            icon={<LockOutlined style={{ color: "black" }} />}
            title= { isUnion ? "创建主节点[众筹]" : "创建主节点" }
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
