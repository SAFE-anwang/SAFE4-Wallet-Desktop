import { Typography, } from "antd";
import { LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  from, to, value, status, isUnion
}: {
  from: string | undefined,
  to: string | undefined,
  value: string | undefined,
  status: number | undefined,
  isUnion: boolean
}) => {
  const { t } = useTranslation();
  return <>
    <TransactionElementTemplate
      icon={<LockOutlined style={{ color: "black" }} />}
      title={isUnion ? t("wallet_history_mn_createunion") : t("wallet_history_mn_create")}
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
