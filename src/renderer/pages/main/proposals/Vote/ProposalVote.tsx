import { Alert, Button, Card, Col, Divider, Row, Space, Tabs, TabsProps, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { LeftOutlined } from '@ant-design/icons';
import { useSelector } from "react-redux";
import { AppState } from "../../../../state";
import { useEffect, useMemo, useState } from "react";
import { formatProposalInfo, formatVoteInfo, ProposalInfo, VoteInfo } from "../../../../structs/Proposal";
import { useProposalContract, useSupernodeStorageContract } from "../../../../hooks/useContracts";
import { DateTimeFormat } from "../../../../utils/DateUtils";
import AddressView from "../../../components/AddressView";
import { useBlockNumber, useTimestamp } from "../../../../state/application/hooks";
import ProposalVoteInfos, { RenderVoteResult } from "./ProposalVoteInfos";
import { RenderProposalState } from "../ProposalList";
import { useETHBalances, useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { CheckCircleFilled, CloseCircleFilled, QuestionCircleFilled } from '@ant-design/icons';
import VoteModalConfirm from "./VoteModal-Confirm";
import { SystemContract } from "../../../../constants/SystemContracts";
import { useTranslation } from "react-i18next";
import AddressComponent from "../../../components/AddressComponent";

const { Text, Title } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const proposalId = useSelector<AppState, number | undefined>(state => state.application.control.proposalId);
  const [proposalInfo, setProposalInfo] = useState<ProposalInfo>();

  const [voteInfos, setVoteInfos] = useState<VoteInfo[]>();
  const supernodeStorageContract = useSupernodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const proposalContractBalance = useETHBalances([SystemContract.Proposal])[SystemContract.Proposal];
  const [voteStatistic, setVoteStatistic] = useState<{
    agree: number,
    reject: number,
    abstain: number,
    voted?: number
  }>({
    agree: 0,
    reject: 0,
    abstain: 0,
  });
  const proposalContract = useProposalContract();
  const timestamp = useTimestamp();
  const blockNumber = useBlockNumber();
  const [openVoteModal, setOpenVoteModal] = useState<boolean>(false);
  const [voteResult, setVoteResult] = useState<number>(3);
  const [activeAccountTops, setActiveAccountTops] = useState<string[]>();
  useEffect(() => {
    if (supernodeStorageContract) {
      supernodeStorageContract.callStatic.getTops4Creator(activeAccount)
        .then(setActiveAccountTops)
    }
  }, [activeAccount, blockNumber, supernodeStorageContract])

  useEffect(() => {
    if (proposalId && proposalContract) {
      proposalContract.callStatic.getInfo(proposalId)
        .then(_proposalInfo => setProposalInfo(formatProposalInfo(_proposalInfo)))
    }
  }, [proposalId, proposalContract, blockNumber]);

  const waitingVote = useMemo(() => {
    if (timestamp && proposalInfo) {
      return proposalInfo.state == 0 && proposalInfo.startPayTime > timestamp
    }
    return false;
  }, [timestamp, proposalInfo]);

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: <>
        {t("wallet_proposals_votes_list")}
      </>,
      children: <ProposalVoteInfos voteInfos={voteInfos} />,
    },
  ];

  useEffect(() => {
    if (proposalId && proposalContract) {
      // function getVoterNum(uint _id) external view returns (uint);
      proposalContract.callStatic.getVoterNum(proposalId)
        .then((_voterNum: any) => {
          const voterNum = _voterNum.toNumber();
          if (voterNum > 0) {
            //  function getVoteInfo(uint _id, uint _start, uint _count) external view returns (VoteInfo[] memory);
            proposalContract.callStatic.getVoteInfo(proposalId, 0, voterNum)
              .then((_voteInfos: any) => {
                const voteStatistic: {
                  agree: number,
                  reject: number,
                  abstain: number,
                  voted?: number
                } = {
                  agree: 0,
                  reject: 0,
                  abstain: 0
                }
                const voteInfos = _voteInfos.map((_voteInfo: any) => {
                  const voteInfo = formatVoteInfo(_voteInfo);
                  if (voteInfo.voteResult == 1) {
                    voteStatistic.agree++;
                  } else if (voteInfo.voteResult == 2) {
                    voteStatistic.reject++;
                  } else if (voteInfo.voteResult == 3) {
                    voteStatistic.abstain++;
                  }
                  if (activeAccount == voteInfo.voter) {
                    voteStatistic.voted = voteInfo.voteResult;
                  }
                  return voteInfo;
                });
                setVoteInfos(voteInfos);
                setVoteStatistic(voteStatistic);
              });
          }
        })
    }
  }, [proposalId, proposalContract, activeAccount, blockNumber]);

  const doVote = (voteResult: number) => {
    setVoteResult(voteResult);
    setOpenVoteModal(true);
  };

  return (<>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/proposals")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_proposal")}:{proposalInfo?.title}
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Row>
            <Col span={24}>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>{t("wallet_proposals_id")}:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.id}</Text>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>{t("wallet_proposals_title")}:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.title}</Text>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>{t("wallet_proposals_creator")}:</Text>
                </Col>
                <Col span={10}>
                  {
                    proposalInfo && <AddressComponent address={proposalInfo?.creator} qrcode copyable />
                  }
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>{t("wallet_proposals_payAmount")}:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.payAmount.toFixed(6)} SAFE</Text>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0px" }} />

              <Row>
                <Col span={24}>
                  <Text type='secondary'>{t("wallet_proposals_description")}:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.description}</Text>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0px" }} />

              <Row>
                <Col span={12}>
                  <Row>
                    <Col span={24}><Text type="secondary">{t("wallet_proposals_paytype")}</Text></Col>
                    <Col span={24}>
                      <Col span={24}>
                        {
                          proposalInfo?.payTimes == 1 && proposalInfo.endPayTime && <>
                            {
                              <>
                                <Text type="secondary">{t("wallet_proposals_pay_at")}</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                                <Text type="secondary"><Text strong>{t("wallet_proposals_pay_onetime")}</Text> {t("wallet_proposals_pay_send")} </Text> <Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
                              </>
                            }
                          </>
                        }
                        {
                          proposalInfo?.payTimes != 1 && proposalInfo?.endPayTime && proposalInfo.startPayTime && <>
                            {
                              <>
                                <Text>{t("wallet_proposals_pay_at")}</Text><Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>{DateTimeFormat(proposalInfo.startPayTime * 1000)}</Text>
                                <Text>{t("wallet_proposals_pay_to")}</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                                <Text><Text strong>{t("wallet_proposals_pay_times")} {proposalInfo.payTimes} {t("wallet_proposals_pay_times_count")}</Text> {t("wallet_proposals_pay_total")} </Text><Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
                              </>
                            }
                          </>
                        }
                      </Col>
                    </Col>
                  </Row>
                </Col>
                {
                  waitingVote &&
                  <Col span={12} style={{ textAlign: "right" }}>
                    <Text type='secondary'>{t("wallet_proposals_poolbalance")}</Text><br />
                    <Text type='secondary'>{proposalContractBalance?.toFixed(2)} SAFE</Text><br />
                  </Col>
                }
              </Row>
              <Divider style={{ margin: "8px 0px" }} />
              <Row>
                <Col span={24}>
                  <Text type='secondary' style={{ marginRight: "20px" }}>{t("wallet_proposals_vote_state")}:</Text>
                  {
                    proposalInfo && <>
                      {RenderProposalState(proposalInfo.state, proposalInfo.startPayTime, timestamp , t)}
                    </>
                  }
                </Col>
                <Col span={18}>
                  <Text>
                    {
                      voteStatistic && <>
                        {t("wallet_proposals_vote_total")} <Text strong>{voteStatistic.agree + voteStatistic.reject + voteStatistic.abstain} {t("wallet_proposals_vote_count")}</Text>
                        <Divider type="vertical" />
                        {t("wallet_proposals_vote_agree")} <Text type="success" strong>{voteStatistic.agree} {t("wallet_proposals_vote_count")}</Text>
                        <Divider type="vertical" />
                        {t("wallet_proposals_vote_reject")} <Text type="danger" strong>{voteStatistic.reject} {t("wallet_proposals_vote_count")}</Text>
                        <Divider type="vertical" />
                        {t("wallet_proposals_vote_abstain")} <Text type="secondary" strong>{voteStatistic.abstain} {t("wallet_proposals_vote_count")}</Text>
                      </>
                    }
                  </Text>
                  <br />
                </Col>
              </Row>
              {
                waitingVote && <>
                  <br />
                  <Row>
                    {
                      activeAccountTops && activeAccountTops.length == 0 && <>
                        <Col span={24}>
                          <Alert type="warning" showIcon message={<>
                            {t("wallet_proposals_vote_tip0")}
                          </>} />
                        </Col>
                      </>
                    }
                    {
                      activeAccountTops && activeAccountTops.length > 0 && <>
                        <Col span={24}>
                          <Alert type="info" showIcon message={<>
                            {t("wallet_proposals_vote_tip1")} <Text strong>{activeAccountTops.length}</Text>,{t("wallet_proposals_vote_tip2")}
                          </>} />
                          <br />
                          {
                            !voteStatistic?.voted && <>
                              <Space>
                                <Button icon={<CheckCircleFilled style={{
                                  color: "#52c41a", fontSize: "14px"
                                }} />} onClick={() => doVote(1)}>{t("wallet_proposals_vote_agree")}</Button>
                                <Button icon={<CloseCircleFilled style={{
                                  color: "#e53d3d", fontSize: "14px"
                                }} />} onClick={() => doVote(2)}>{t("wallet_proposals_vote_reject")}</Button>
                                <Button icon={<QuestionCircleFilled style={{
                                  color: "#c3a4a4", fontSize: "14px"
                                }} />} onClick={() => doVote(3)}>{t("wallet_proposals_vote_abstain")}</Button>
                              </Space>
                            </>
                          }
                          {
                            voteStatistic?.voted && <>
                              {t("wallet_proposals_vote_voted")} <Divider type="vertical" style={{ height: "24px" }} /> {RenderVoteResult(voteStatistic.voted)}
                            </>
                          }
                        </Col>
                      </>
                    }
                  </Row>
                </>
              }
              {
                voteStatistic?.voted && !waitingVote && <span style={{ lineHeight: "42px" }}>
                  {t("wallet_proposals_vote_voted")} <Divider type="vertical" style={{ height: "24px" }} /> {RenderVoteResult(voteStatistic.voted)}
                </span>
              }
            </Col>
          </Row>
          <Divider style={{ margin: "16px 0px" }} />
          <Row>
            <Col span={24}>
              <Tabs items={items}></Tabs>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
    {
      proposalInfo && <>
        <VoteModalConfirm openVoteModal={openVoteModal} setOpenVoteModal={setOpenVoteModal} proposalInfo={proposalInfo} voteResult={voteResult} />
      </>
    }
  </>)

}
