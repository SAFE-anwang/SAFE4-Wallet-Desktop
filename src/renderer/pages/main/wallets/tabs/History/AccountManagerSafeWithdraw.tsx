import { Typography, } from "antd";
import { RetweetOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  from, to, value, status
}: {
  from: string | undefined,
  to: string | undefined,
  value: string | undefined,
  status: number | undefined
}) => {
  const { t } = useTranslation();
  return <>
    <TransactionElementTemplate
      icon={<RetweetOutlined style={{ color: "black" }} />}
      title={t("wallet_history_am_withdraw")}
      status={status}
      description={to}
      assetFlow={<>
        <Text type="secondary" strong>
          <RetweetOutlined style={{ marginRight: "5px" }} />
          {value && EtherAmount({ raw: value, fix: 18 })} SAFE
        </Text>
      </>}
    />
  </>
}
