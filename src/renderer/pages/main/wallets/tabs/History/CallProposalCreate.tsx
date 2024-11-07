import { Typography, } from "antd";
import { LockOutlined, FilePptOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  title, value, status, payAmount
}: {
  title: string | undefined,
  value: string,
  status: number | undefined,
  payAmount: string
}) => {
  const { t } = useTranslation();
  return <>
    <TransactionElementTemplate
      icon={<FilePptOutlined style={{ color: "black" }} />}
      title={t("wallet_history_proposals_create")}
      status={status}
      description={`${title} :[${t("wallet_proposals_payAmount")} ${payAmount} SAFE]`}
      assetFlow={<>
        <Text strong>-{value && EtherAmount({ raw: value, fix: 18 })} SAFE</Text>
      </>}
    />

  </>
}
