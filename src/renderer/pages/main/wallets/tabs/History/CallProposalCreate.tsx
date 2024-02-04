import { Typography, } from "antd";
import { LockOutlined,FilePptOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({
  title, value, status , payAmount
}: {
  title: string | undefined,
  value: string,
  status: number | undefined,
  payAmount : string
}) => {

  return <>
    <TransactionElementTemplate
      icon={<FilePptOutlined style={{ color: "black" }} />}
      title={"创建提案"}
      status={status}
      description={ `${title} :[申请 ${payAmount} SAFE]` }
      assetFlow={<>
        <Text strong>-{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
      </>}
    />

  </>
}
