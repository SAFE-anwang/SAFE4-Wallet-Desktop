import { Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { MemberInfo } from "../../structs/Supernode"
import AddressView from "./AddressView";
import AddressComponent from "./AddressComponent";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  memberInfos
}: {
  memberInfos: MemberInfo[]
}) => {
  const { t } = useTranslation();
  const columns: ColumnsType<MemberInfo> = [
    {
      title: t("wallet_locked_accountRecordLockId"),
      dataIndex: 'lockID',
      key: 'lockID',
      render: (lockID) => {
        return <>{lockID}</>
      }
    },
    {
      title: t("address"),
      dataIndex: 'addr',
      key: 'addr',
      render: (addr) => {
        return <>
          <div style={{ width: "80%" }}>
            <AddressComponent address={addr} />
          </div>
        </>
      }
    },
    {
      title: t("stake"),
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
