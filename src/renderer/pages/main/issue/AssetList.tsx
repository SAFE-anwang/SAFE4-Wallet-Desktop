import { Table } from "antd";
import { useAuditTokenList } from "../../../state/audit/hooks"


export default () => {

  const auditTokens = useAuditTokenList();

  const columns = [
    {
      title: '资产',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '合约地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '管理者',
      dataIndex: 'address',
      key: 'address',
    },
  ];


  return <>

    <Table dataSource={auditTokens} columns={columns} />

  </>

}
