import { Button, Card, Col, Divider, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useSelector } from "react-redux";
import { AppState } from "../../../../state";
import { useEffect, useState } from "react";
import { formatProposalInfo, formatVoteInfo, ProposalInfo, VoteInfo } from "../../../../structs/Proposal";
import { useProposalContract } from "../../../../hooks/useContracts";
import { DateTimeFormat } from "../../../../utils/DateUtils";
import AddressView from "../../../components/AddressView";
import { useBlockNumber, useTimestamp } from "../../../../state/application/hooks";

const { Text, Title } = Typography;

export default () => {

    const navigate = useNavigate();
    const proposalId = useSelector<AppState, number | undefined>(state => state.application.control.proposalId);
    const [proposalInfo, setProposalInfo] = useState<ProposalInfo>();
    const [voteInfos , setVoteInfos] = useState<VoteInfo>();
    const [voteStatistic , setVoteStatistic] = useState<{
        agree : number,
        reject : number,
        abstain : number,
    }>();
    const proposalContract = useProposalContract();
    const timestamp = useTimestamp();
    const blockNumber = useBlockNumber();

    useEffect(() => {
        if (proposalId && proposalContract) {
            proposalContract.callStatic.getInfo(proposalId)
                .then(_proposalInfo => setProposalInfo(formatProposalInfo(_proposalInfo)))


        }
    }, [proposalId, proposalContract]);

    useEffect(() => {
        if (proposalId && proposalContract) {
            // function getVoterNum(uint _id) external view returns (uint);
            proposalContract.callStatic.getVoterNum(proposalId)
                .then(_voterNum => {
                    const voterNum = _voterNum.toNumber();
                    if (voterNum > 0) {
                        //  function getVoteInfo(uint _id, uint _start, uint _count) external view returns (VoteInfo[] memory);
                        proposalContract.callStatic.getVoteInfo(proposalId, 0, voterNum)
                            .then(_voteInfos => {
                                const voteStatistic = {
                                    agree : 0,
                                    reject : 0,
                                    abstain : 0
                                };
                                const voteInfos = _voteInfos.map( (_voteInfo : any) => {
                                    const voteInfo = formatVoteInfo(_voteInfo);
                                    if ( voteInfo.voteResult == 1 ){
                                        voteStatistic.agree ++;
                                    }else if ( voteInfo.voteResult == 2 ){
                                        voteStatistic.reject ++;
                                    }else if ( voteInfo.voteResult == 3 ){
                                        voteStatistic.abstain ++;
                                    }
                                    return voteInfo;
                                });
                                setVoteInfos(voteInfos);
                                setVoteStatistic(voteStatistic);
                            });
                    }
                })
        }
    }, [proposalId, proposalContract]);

    return (<>

        <Row style={{ height: "50px" }}>
            <Col span={8}>
                <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
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
                        <Col span={10}>
                            <Row>
                                <Col span={24}><Text type="secondary">提案ID</Text></Col>
                                <Col span={24}>{proposalInfo?.id}</Col>
                            </Row>
                            <Divider style={{ margin: "8px 0px" }} />
                            <Row>
                                <Col span={24}><Text type="secondary">提案标题</Text></Col>
                                <Col span={24}>{proposalInfo?.title}</Col>
                            </Row>
                            <Divider style={{ margin: "8px 0px" }} />
                            <Row>
                                <Col span={24}><Text type="secondary">提案简介</Text></Col>
                                <Col span={24}>{proposalInfo?.description}</Col>
                            </Row>
                            <Divider style={{ margin: "8px 0px" }} />
                            <Row>
                                <Col span={24}><Text type="secondary">创建人</Text></Col>
                                <Col span={24}>
                                    {
                                        proposalInfo && <Text strong><AddressView address={proposalInfo?.creator} /></Text>
                                    }
                                </Col>
                            </Row>
                            <Divider style={{ margin: "8px 0px" }} />
                            <Row>
                                <Col span={24}><Text type="secondary">申请SAFE数量</Text></Col>
                                <Col span={24}><Text strong>{proposalInfo?.payAmount.toFixed(6)} SAFE</Text></Col>
                            </Row>
                            <Divider style={{ margin: "8px 0px" }} />
                            <Row>
                                <Col span={24}><Text type="secondary">发放方式</Text></Col>
                                <Col span={24}>
                                    <Col span={24}>
                                        {
                                            proposalInfo?.payTimes == 1 && proposalInfo.endPayTime && <>
                                                {
                                                    <>
                                                        <Text type="secondary">在</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime)}</Text><br />
                                                        <Text type="secondary"><Text strong>一次性</Text> 发放 </Text> <Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>

                                                    </>
                                                }
                                            </>
                                        }
                                        {
                                            proposalInfo?.payTimes != 1 && proposalInfo?.endPayTime && proposalInfo.startPayTime && <>
                                                {
                                                    <>
                                                        <Text>在</Text><Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>{DateTimeFormat(proposalInfo.startPayTime)}</Text>
                                                        <Text>到</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime)}</Text><br />
                                                        <Text><Text strong>分期{proposalInfo.payTimes}次</Text> 合计发放 </Text><Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
                                                    </>
                                                }
                                            </>
                                        }
                                    </Col>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>

    </>)

}