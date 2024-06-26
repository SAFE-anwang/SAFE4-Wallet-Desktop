import { Typography, } from "antd";
import { LockOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useMemo } from "react";

const { Text } = Typography;

export default ({
  from, to, value, status
}: {
  from: string | undefined,
  to: string | undefined,
  value: string | undefined,
  status: number | undefined
}) => {
  const activeAccount = useWalletsActiveAccount();

  const lockIntoItSelf = useMemo(() => {
    return to == activeAccount;
  }, [to, activeAccount]);

  return <>
    <TransactionElementTemplate
      icon={<LockOutlined style={{ color: "black" }} />}
      title="批量锁仓"
      status={status}
      description={to}
      assetFlow={<>
        {
          lockIntoItSelf && <Text type="secondary" strong>
            <LockOutlined style={{ marginRight: "5px" }} />
            {value && EtherAmount({ raw: value, fix: 18 })} SAFE
          </Text>
        }
        {
          !lockIntoItSelf && <Text strong> <>- {value && EtherAmount({ raw: value })} SAFE</> </Text>
        }
      </>}
    />

  </>
}
