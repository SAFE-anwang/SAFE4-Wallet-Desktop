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

const { Text, Title } = Typography;

export default () => {

  const navigate = useNavigate();
  const proposalId = useSelector<AppState, number | undefined>(state => state.application.control.proposalId);
  const [proposalInfo, setProposalInfo] = useState<ProposalInfo>();
  const [voteInfos, setVoteInfos] = useState<VoteInfo[]>();
  const supernodeStorageContract = useSupernodeStorageContract();
  const [topSupernodeAddresses, setTopSupernodeAddress] = useState<string[]>([]);
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

  useEffect(() => {
    if (proposalId && proposalContract) {
      proposalContract.callStatic.getInfo(proposalId)
        .then(_proposalInfo => setProposalInfo(formatProposalInfo(_proposalInfo)))
    }
  }, [proposalId, proposalContract, blockNumber]);
  useEffect(() => {
    if (supernodeStorageContract) {
      supernodeStorageContract.callStatic.getTops()
        .then(addresses => setTopSupernodeAddress(addresses))
    }
  }, [supernodeStorageContract]);

  const activeAccountIsValidSupernode = useMemo(() => {
    if (activeAccount && topSupernodeAddresses.length > 0) {
      return topSupernodeAddresses.indexOf(activeAccount) >= 0;
    }
    return false;
  }, [activeAccount, topSupernodeAddresses]);

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
        提案投票记录
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
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/proposals")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          提案:{proposalInfo?.title}
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
                  <Text type='secondary'>提案ID:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.id}</Text>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>提案标题:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.title}</Text>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>创建人:</Text>
                </Col>
                <Col span={18}>
                  <Text strong> {
                    proposalInfo && <Text strong><AddressView address={proposalInfo?.creator} /></Text>
                  }</Text>
                </Col>
              </Row>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>申请SAFE数量:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.payAmount.toFixed(6)} SAFE</Text>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0px" }} />

              <Row>
                <Col span={24}>
                  <Text type='secondary'>提案简介:</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{proposalInfo?.description}</Text>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0px" }} />

              <Row>
                <Col span={12}>
                  <Row>
                    <Col span={24}><Text type="secondary">发放方式</Text></Col>
                    <Col span={24}>
                      <Col span={24}>
                        {
                          proposalInfo?.payTimes == 1 && proposalInfo.endPayTime && <>
                            {
                              <>
                                <Text type="secondary">在</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                                <Text type="secondary"><Text strong>一次性</Text> 发放 </Text> <Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>

                              </>
                            }
                          </>
                        }
                        {
                          proposalInfo?.payTimes != 1 && proposalInfo?.endPayTime && proposalInfo.startPayTime && <>
                            {
                              <>
                                <Text>在</Text><Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>{DateTimeFormat(proposalInfo.startPayTime * 1000)}</Text>
                                <Text>到</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                                <Text><Text strong>分期{proposalInfo.payTimes}次</Text> 合计发放 </Text><Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
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
                    <Text type='secondary'>提案资金池余额</Text><br />
                    <Text type='secondary'>{proposalContractBalance?.toFixed(2)} SAFE</Text><br />
                  </Col>
                }
              </Row>
              <Divider style={{ margin: "8px 0px" }} />
              <Row>
                <Col span={24}>
                  <Text type='secondary' style={{ marginRight: "20px" }}>投票状态:</Text>
                  {
                    proposalInfo && <>
                      {RenderProposalState(proposalInfo.state, proposalInfo.startPayTime, timestamp)}
                    </>
                  }
                </Col>
                <Col span={18}>
                  <Text>
                    {
                      voteStatistic && <>
                        合计 <Text strong>{voteStatistic.agree + voteStatistic.reject + voteStatistic.abstain} 票</Text>
                        <Divider type="vertical" />
                        同意 <Text type="success" strong>{voteStatistic.agree} 票</Text>
                        <Divider type="vertical" />
                        拒绝 <Text type="danger" strong>{voteStatistic.reject} 票</Text>
                        <Divider type="vertical" />
                        弃权 <Text type="secondary" strong>{voteStatistic.abstain} 票</Text>
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
                      !activeAccountIsValidSupernode && <>
                        <Col span={24}>
                          <Alert type="warning" showIcon message={<>
                            当前账户不是排名前49且在线的超级节点，不能对提案进行投票!
                          </>} />
                        </Col>
                      </>
                    }
                    {
                      activeAccountIsValidSupernode && <>
                        <Col span={24}>
                          <Alert type="info" showIcon message={<>
                            当前账户是排名前49且在线的超级节点，可以对提案进行投票
                          </>} />
                          <br />
                          {
                            !voteStatistic?.voted && <>
                              <Space>
                                <Button icon={<CheckCircleFilled style={{
                                  color: "#52c41a", fontSize: "14px"
                                }} />} onClick={() => doVote(1)}>同意</Button>
                                <Button icon={<CloseCircleFilled style={{
                                  color: "#e53d3d", fontSize: "14px"
                                }} />} onClick={() => doVote(2)}>拒绝</Button>
                                <Button icon={<QuestionCircleFilled style={{
                                  color: "#c3a4a4", fontSize: "14px"
                                }} />} onClick={() => doVote(3)}>弃权</Button>
                              </Space>
                            </>
                          }
                          {
                            voteStatistic?.voted && <>
                              已投 <Divider type="vertical" style={{ height: "24px" }} /> {RenderVoteResult(voteStatistic.voted)}
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
                  已投 <Divider type="vertical" style={{ height: "24px" }} /> {RenderVoteResult(voteStatistic.voted)}
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
