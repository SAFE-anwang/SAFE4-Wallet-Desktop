import Table, { ColumnsType } from "antd/es/table";
import { VoteInfo } from "../../../../structs/Proposal"
import AddressView from "../../../components/AddressView";
import { Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled } from '@ant-design/icons';


const { Text } = Typography;

export const RenderVoteResult = (voteResult: number) => {
  switch (voteResult) {
    case 1:
      return <>
        <Text>
          <CheckCircleFilled style={{
            color: "#52c41a", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="success">同意</Text>
        </Text>
      </>
    case 2:
      return <>
        <Text>
          <CloseCircleFilled style={{
            color: "#e53d3d", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="danger">拒绝</Text>
        </Text>
      </>
    case 3:
      return <>
        <Text>
          <QuestionCircleFilled style={{
            color: "#c3a4a4", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="secondary">弃权</Text>
        </Text>
      </>
  }
}

export default ({
  voteInfos
}: {
  voteInfos?: VoteInfo[]
}) => {



  const columns: ColumnsType<VoteInfo> = [
    {
      title: '超级节点',
      dataIndex: 'voter',
      key: 'voter',
      render: (voter) => {
        return <>
          <AddressView address={voter}></AddressView>
        </>
      }
    },
    {
      title: '投票结果',
      dataIndex: 'voteResult',
      key: 'voteResult',
      render: (voteResult) => {
        return <>{RenderVoteResult(voteResult)}</>
      }
    },
  ];
  return <>
    <Table dataSource={voteInfos} columns={columns} />
  </>

  return (<></>)
}
