import { Typography, } from "antd";
import { LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({
    from, to, value, status
}: {
    from: string | undefined,
    to: string | undefined,
    value: string | undefined,
    status: number | undefined ,
}) => {

    return <>
        <TransactionElementTemplate
            icon={<LockOutlined style={{ color: "black" }} />}
            title= { "投票超级节点" }
            status={status}
            description={to}
            assetFlow={<>

            </>}
        />

    </>
}
