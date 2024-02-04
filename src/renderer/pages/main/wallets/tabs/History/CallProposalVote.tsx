import { Typography, } from "antd";
import { LockOutlined, FilePptOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { RenderVoteResult } from "../../../proposals/Vote/ProposalVoteInfos";

const { Text } = Typography;

export default ({
  proposalId, voteResult, status
}: {
  proposalId: number,
  voteResult: number,
  status: number | undefined,
}) => {

  return <>
    <TransactionElementTemplate
      icon={<FilePptOutlined style={{ color: "black" }} />}
      title={"提案投票"}
      status={status}
      description={<>
        提案ID:{proposalId}
      </>}
      assetFlow={<>
        {RenderVoteResult(voteResult)}
      </>}
    />
  </>
}
