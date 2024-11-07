import { Typography, } from "antd";
import { LockOutlined, FilePptOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { RenderVoteResult } from "../../../proposals/Vote/ProposalVoteInfos";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  proposalId, voteResult, status
}: {
  proposalId: number,
  voteResult: number,
  status: number | undefined,
}) => {
  const { t } = useTranslation();
  return <>
    <TransactionElementTemplate
      icon={<FilePptOutlined style={{ color: "black" }} />}
      title={ t("wallet_history_proposals_vote") }
      status={status}
      description={<>
        {t("wallet_proposals_id")}:{proposalId}
      </>}
      assetFlow={<>
        {RenderVoteResult(voteResult , t)}
      </>}
    />
  </>
}
