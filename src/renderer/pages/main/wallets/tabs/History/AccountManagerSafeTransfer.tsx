import { Typography, } from "antd";
import { LockFilled, RetweetOutlined, GiftOutlined } from '@ant-design/icons';
import TransactionElementTemplate from "./TransactionElementTemplate";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useMemo } from "react";
import { SystemContract } from "../../../../../constants/SystemContracts";
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
  const isProposalReward = useMemo(() => {
    return SystemContract.Proposal == from;
  }, [from]);

  const ProposalRewardRender = useMemo(() => {
    if (isProposalReward) {
      return <>
        <TransactionElementTemplate
          icon={<GiftOutlined style={{ color: "black" }} />}
          title={<Text type="success">{t("wallet_history_am_transfer_byproposal")}</Text>}
          status={status}
          description={to}
          assetFlow={<>
            <Text type="success" strong>
              +
              <LockFilled style={{ marginRight: "5px", marginLeft: "5px" }} />
              {value && EtherAmount({ raw: value, fix: 18 })} SAFE
            </Text>
          </>}
        />
      </>
    }
  }, [isProposalReward]);

  const SafeTransferRender = useMemo(() => {
    if (!isProposalReward) {
      return <>
        <TransactionElementTemplate
          icon={<RetweetOutlined style={{ color: "black" }} />}
          title={t("wallet_history_am_transfer")}
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
  }, [isProposalReward])

  return <>
    {isProposalReward ? ProposalRewardRender : SafeTransferRender}
  </>
}
