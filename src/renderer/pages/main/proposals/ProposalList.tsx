import { Badge, Button, Col, Row, Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMulticallContract, useProposalContract } from "../../../hooks/useContracts"
import { applicationControlVoteProposal } from "../../../state/application/action";
import { useTimestamp } from "../../../state/application/hooks";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { formatProposalInfo, ProposalInfo } from "../../../structs/Proposal";
import { DateTimeFormat } from "../../../utils/DateUtils";
import AddressView from "../../components/AddressView";

const { Text } = Typography;
const Proposals_Page_Size = 10;

export const RenderProposalState = (state: number, startPayTime: number, latestBlockTimestamp: number) => {
  switch (state) {
      case 0:
          if (latestBlockTimestamp >= startPayTime) {
              return <Badge status="default" text="失效" />
          }
          return <Badge status="processing" text="正在投票" />
      case 1:
          return <Badge status="success" text="通过" />
      case 2:
          return <Badge status="error" text="未通过" />
      default:
          return <Badge status="default" text="失效" />
  }
}

export default ({
    queryMyProposals
}: {
    queryMyProposals?: boolean
}) => {
    const proposalContract = useProposalContract();
    const activeAccount = useWalletsActiveAccount();
    const multicallContract = useMulticallContract();
    const timestamp = useTimestamp();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [proposalInfos, setProposalInfos] = useState<ProposalInfo[]>();
    const [loading, setLoading] = useState<boolean>(false);

    const [pagination, setPagination] = useState<{
        total: number | undefined
        pageSize: number | undefined,
        current: number | undefined,
    }>();
    useEffect(() => {
        if (proposalContract) {
            if (queryMyProposals) {
                // function getMineNum() external view returns (uint);
                proposalContract.callStatic.getMineNum()
                    .then(data => {
                        console.log(`query ${activeAccount} proposals num :${data.toNumber()}` )
                        setPagination({
                            total: data.toNumber(),
                            pageSize: Proposals_Page_Size,
                            current: 1,
                        })
                    })
            } else {
                // function getNum() external view returns (uint);
                proposalContract.callStatic.getNum()
                    .then(data => {
                        setPagination({
                            total: data.toNumber(),
                            pageSize: Proposals_Page_Size,
                            current: 1,
                        })
                    })
            }
        }
    }, [proposalContract,activeAccount]);

    useEffect(() => {
        if (pagination && proposalContract && multicallContract) {
            const { pageSize, current, total } = pagination;
            if (current && pageSize && total && total > 0) {
                setLoading(true);
                if (queryMyProposals) {
                    //  function getMines(uint _start, uint _count) external view returns (uint[] memory);
                    proposalContract.callStatic.getMines((current - 1) * pageSize, pageSize)
                        .then((proposalIds: any) => {
                            multicallGetProposalInfoByIds(proposalIds)
                        });
                } else {
                    // function getAll(uint _start, uint _count) external view returns (uint[] memory);
                    proposalContract.callStatic.getAll((current - 1) * pageSize, pageSize)
                        .then((proposalIds: any) => {
                            multicallGetProposalInfoByIds(proposalIds)
                        });
                }
            }else{
                setProposalInfos(undefined);
            }
        }
    }, [pagination]);

    const multicallGetProposalInfoByIds = useCallback((proposalIds: any) => {
        if (multicallContract && proposalContract) {
            // function getInfo(uint _id) external view returns (ProposalInfo memory);
            const fragment = proposalContract.interface.getFunction("getInfo")
            const calls = proposalIds.map((proposalId: any) => [
                proposalContract.address,
                proposalContract.interface.encodeFunctionData(fragment, [proposalId.toNumber()])
            ])
            multicallContract.callStatic.aggregate(calls)
                .then(data => {
                    const proposalInfos = data[1].map((raw: string) => {
                        const _proposalInfo = proposalContract.interface.decodeFunctionResult(fragment, raw)[0];
                        return formatProposalInfo(_proposalInfo);
                    })
                    setProposalInfos(proposalInfos);
                    setLoading(false);
                })
        }
    }, [multicallContract, proposalContract]);

    const columns: ColumnsType<ProposalInfo> = [
        {
            title: '提案ID',
            dataIndex: 'id',
            key: '_id',
            render: (id) => {
                return <>
                    <Row>
                        <Col>
                            <Text strong>{id}</Text>
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            render: (state, proposalInfo: ProposalInfo) => {
                return <>
                    <Row>
                        <Col span={24}>
                            {RenderProposalState(state, proposalInfo.startPayTime, timestamp)}
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '创建人',
            dataIndex: 'creator',
            key: 'creator',
            render: (creator) => {
                const _addr = creator.substring(0, 10) + "...." + creator.substring(creator.length - 8);
                return <>
                    <Row>
                        <Col span={24}>
                            <Text strong>
                                <AddressView address={_addr}></AddressView>
                            </Text>
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            render: (title) => {
                return <>
                    <Row>
                        <Col span={24}>
                            <Text strong ellipsis style={{width:"120px"}}>
                                {title}
                            </Text>
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '申请SAFE数量',
            dataIndex: 'payAmount',
            key: 'payAmount',
            render: (payAmount) => {
                return <>
                    <Row>
                        <Col span={24}>
                            <Text strong>
                               {payAmount.toFixed(2)} SAFE
                            </Text>
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '截止日期',
            dataIndex: 'startPayTime',
            key: 'startPayTime',
            render: (startPayTime) => {
                return <>
                    <Row>
                        <Col span={24}>
                            <Text strong>
                                {DateTimeFormat(startPayTime)}
                            </Text>
                        </Col>
                    </Row>
                </>
            },
        },
        {
            title: '操作',
            dataIndex: 'id',
            key: '_id',
            render: (id) => {
                return <>
                    <Row>
                        <Col span={24}>
                            <Button onClick={() => {
                                dispatch(applicationControlVoteProposal(id))
                                navigate("/main/proposals/vote")
                            }}>查看</Button>
                        </Col>
                    </Row>
                </>
            },
        },
    ];



    return <>
        <Table loading={loading} onChange={(pagination) => {
            const { current, pageSize, total } = pagination;
            setPagination({
                current, pageSize, total
            })
        }} dataSource={proposalInfos} columns={columns} size="large" pagination={pagination} />
    </>

}
