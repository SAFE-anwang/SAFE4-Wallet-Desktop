import Table, { ColumnsType } from "antd/es/table";
import { VoteInfo } from "../../../../structs/Proposal"
import AddressView from "../../../components/AddressView";
import { Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled } from '@ant-design/icons';
import { useTranslation } from "react-i18next";


const { Text } = Typography;

export const RenderVoteResult = (voteResult: number, t?: any) => {
  switch (voteResult) {
    case 1:
      return <>
        <Text>
          <CheckCircleFilled style={{
            color: "#52c41a", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="success">
            {t ? t("wallet_proposals_vote_agree") : "同意"}
          </Text>
        </Text>
      </>
    case 2:
      return <>
        <Text>
          <CloseCircleFilled style={{
            color: "#e53d3d", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="danger">
            {t ? t("wallet_proposals_vote_reject") : "拒绝"}
          </Text>
        </Text>
      </>
    case 3:
      return <>
        <Text>
          <QuestionCircleFilled style={{
            color: "#c3a4a4", fontSize: "16px", marginRight: "10px", marginLeft: "10px"
          }} />
          <Text type="secondary">
            {t ? t("wallet_proposals_vote_abstain") : "期权"}
          </Text>
        </Text>
      </>
  }
}

export default ({
  voteInfos
}: {
  voteInfos?: VoteInfo[]
}) => {

  const { t } = useTranslation();

  const columns: ColumnsType<VoteInfo> = [
    {
      title: t("wallet_proposals_votes_supernode"),
      dataIndex: 'voter',
      key: 'voter',
      render: (voter) => {
        return <>
          <AddressView address={voter}></AddressView>
        </>
      }
    },
    {
      title: t("wallet_proposals_votes_result"),
      dataIndex: 'voteResult',
      key: 'voteResult',
      render: (voteResult) => {
        return <>{RenderVoteResult(voteResult , t)}</>
      }
    },
  ];
  return <>
    <Table dataSource={voteInfos} columns={columns} />
  </>

  return (<></>)
}
