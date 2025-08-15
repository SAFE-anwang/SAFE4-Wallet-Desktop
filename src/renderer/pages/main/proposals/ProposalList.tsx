import { Alert, Badge, Button, Col, Input, Row, Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMulticallContract, useProposalContract } from "../../../hooks/useContracts"
import { applicationControlVoteProposal } from "../../../state/application/action";
import { useTimestamp } from "../../../state/application/hooks";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { formatProposalInfo, ProposalInfo } from "../../../structs/Proposal";
import { DateTimeFormat } from "../../../utils/DateUtils";
import AddressComponent from "../../components/AddressComponent";
import { useReadedProposalIds } from "../../../state/proposals/hooks";

const { Text } = Typography;
const Proposals_Page_Size = 10;

export const RenderProposalState = (state: number, startPayTime: number, latestBlockTimestamp: number, t?: any) => {
  switch (state) {
    case 0:
      if (latestBlockTimestamp >= startPayTime) {
        return <Badge status="default" text={<Text style={{ color: "#00000040" }}>{t ? t("wallet_proposals_state_invalid") : "失效"}</Text>} />
      }
      return <Badge status="processing" text={t ? t("wallet_proposals_state_voting") : "正在投票"} />
    case 1:
      return <Badge status="success" text={<Text strong type="success">{t ? t("wallet_proposals_state_pass") : "通过"}</Text>} />
    case 2:
      return <Badge status="error" text={t ? t("wallet_proposals_state_rejected") : "未通过"} />
    default:
      return <Badge status="default" text={<Text style={{ color: "#00000040" }}>{t ? t("wallet_proposals_state_invalid") : "失效"}</Text>} />
  }
}

export const RenderTextColor = (state: number, startPayTime: number, latestBlockTimestamp: number) => {
  switch (state) {
    case 0:
      if (latestBlockTimestamp >= startPayTime) {
        return "#00000040"
      }
      return ""
    case 1:
      return ""
    case 2:
      return ""
    default:
      return ""
  }
}

export default ({
  queryMyProposals
}: {
  queryMyProposals?: boolean
}) => {
  const { t } = useTranslation();
  const proposalContract = useProposalContract();
  const activeAccount = useWalletsActiveAccount();
  const multicallContract = useMulticallContract();
  const timestamp = useTimestamp();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [proposalInfos, setProposalInfos] = useState<ProposalInfo[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [queryKey, setQueryKey] = useState<string>();
  const [queryKeyError, setQueryKeyError] = useState<string>();

  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    pageSizeOptions: []
  }>();

  useEffect(() => {
    if (proposalContract) {
      if (pagination && pagination.current != 1) {
        // 如果已经刷新过数据且不是第一页的情况下,不自动刷新数据.
        return;
      }
      if (queryMyProposals) {
        // function getMineNum() external view returns (uint);
        proposalContract.callStatic.getMineNum(activeAccount)
          .then(data => {
            setPagination({
              total: data.toNumber(),
              pageSize: Proposals_Page_Size,
              current: 1,
              pageSizeOptions: []
            })
          })
      } else {
        if (queryKey) {
          doSearch();
          return;
        }
        // function getNum() external view returns (uint);
        proposalContract.callStatic.getNum()
          .then(data => {
            setPagination({
              total: data.toNumber(),
              pageSize: Proposals_Page_Size,
              current: 1,
              pageSizeOptions: []
            })
          })
      }
    }
  }, [proposalContract, activeAccount, timestamp, queryKey]);

  useEffect(() => {
    if (pagination && proposalContract && multicallContract) {
      const { pageSize, current, total } = pagination;
      if (current && pageSize && total && total > 0) {
        //////////////////// 逆序 ////////////////////////
        let position = total - (pageSize * current);
        let offset = pageSize;
        if (position < 0) {
          offset = pageSize + position;
          position = 0;
        }
        /////////////////////////////////////////////////
        setLoading(true);
        if (queryMyProposals) {
          //  function getMines(uint _start, uint _count) external view returns (uint[] memory);
          proposalContract.callStatic.getMines(activeAccount, position, offset)
            .then((proposalIds: any) => {
              multicallGetProposalInfoByIds(proposalIds)
            });
        } else {
          // function getAll(uint _start, uint _count) external view returns (uint[] memory);
          proposalContract.callStatic.getAll(position, offset)
            .then((proposalIds: any) => {
              multicallGetProposalInfoByIds(proposalIds)
            });
        }
      } else {
        setProposalInfos(undefined);
      }
    }
  }, [pagination, activeAccount]);

  const multicallGetProposalInfoByIds = useCallback((_proposalIds: any) => {
    if (multicallContract && proposalContract) {
      const proposalIds = _proposalIds.map((_id: any) => _id.toNumber()).sort((id0: number, id1: number) => id1 - id0)
      // function getInfo(uint _id) external view returns (ProposalInfo memory);
      const fragment = proposalContract.interface.getFunction("getInfo")
      const calls = proposalIds.map((proposalId: any) => [
        proposalContract.address,
        proposalContract.interface.encodeFunctionData(fragment, [proposalId])
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
      title: "ID",
      dataIndex: 'id',
      key: '_id',
      render: (id, proposalInfo) => {
        return <>
          <Row>
            <Col>
              <Text strong style={{ color: RenderTextColor(proposalInfo.state, proposalInfo.startPayTime, timestamp) }}>{id}</Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_state"),
      dataIndex: 'state',
      key: 'state',
      render: (state, proposalInfo: ProposalInfo) => {
        return <>
          <Row>
            <Col span={24}>
              {RenderProposalState(state, proposalInfo.startPayTime, timestamp, t)}
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_creator"),
      dataIndex: 'creator',
      key: 'creator',
      render: (creator, proposalInfo) => {
        return <>
          <Row>
            <Col span={24}>
              <Text strong style={{ color: RenderTextColor(proposalInfo.state, proposalInfo.startPayTime, timestamp) }} >
                <AddressComponent address={creator} ellipsis copyable qrcode />
              </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_title"),
      dataIndex: 'title',
      key: 'title',
      render: (title, proposalInfo) => {
        return <>
          <Row>
            <Col span={24}>
              <Text strong ellipsis style={{ width: "120px", color: RenderTextColor(proposalInfo.state, proposalInfo.startPayTime, timestamp) }}>
                {title}
              </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_payAmount"),
      dataIndex: 'payAmount',
      key: 'payAmount',
      render: (payAmount, proposalInfo) => {
        return <>
          <Row>
            <Col span={24}>
              <Text strong style={{ color: RenderTextColor(proposalInfo.state, proposalInfo.startPayTime, timestamp) }}>
                {payAmount.toFixed(2)} SAFE
              </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_endtime"),
      dataIndex: 'startPayTime',
      key: 'startPayTime',
      render: (startPayTime, proposalInfo) => {
        return <>
          <Row>
            <Col span={24}>
              <Text strong style={{ color: RenderTextColor(proposalInfo.state, proposalInfo.startPayTime, timestamp) }}>
                {DateTimeFormat(startPayTime * 1000)}
              </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: t("wallet_proposals_operation"),
      dataIndex: 'id',
      key: '_id',
      render: (id) => {
        return <>
          <Row>
            <Col span={24}>
              <Button onClick={() => {
                dispatch(applicationControlVoteProposal(id))
                navigate("/main/proposals/vote")
              }}>{t("view")}</Button>
            </Col>
          </Row>
        </>
      },
    },
  ];

  const doSearch = useCallback(async () => {
    if (proposalContract && queryKey) {
      const id = Number(queryKey);
      if (id && id > 0) {
        setLoading(true);
        const proposalInfo = formatProposalInfo(await proposalContract.callStatic.getInfo(id));
        if (id == proposalInfo.id) {
          setProposalInfos([proposalInfo]);
          setPagination(undefined);
          setLoading(false);
        } else {
          setQueryKeyError(t("wallet_proposals_id") + " " + t("notExist"))
          setProposalInfos([]);
          setPagination(undefined);
          setLoading(false);
        }
      } else {
        setQueryKeyError(t("enter_correct") + t("wallet_proposals_id"));
      }

    }
  }, [proposalContract, queryKey]);


  const readedProposalIds = useReadedProposalIds();

  return <>

    {
      !queryMyProposals &&
      <Row style={{ marginBottom: "20px" }}>
        <Col span={12}>
          <Input.Search size='large' placeholder={t("enter") + t("wallet_proposals_id")} onChange={(event) => {
            setQueryKeyError(undefined);
            if (!event.target.value) {
              setQueryKey(undefined);
            }
          }} onSearch={setQueryKey} />
          {
            queryKeyError &&
            <Alert type='error' showIcon message={queryKeyError} style={{ marginTop: "5px" }} />
          }
        </Col>
      </Row>
    }

    {
      JSON.stringify(readedProposalIds)
    }
    <Table loading={loading} onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current, pageSize, total,
        pageSizeOptions: []
      })
    }} dataSource={proposalInfos} columns={columns} size="large" pagination={pagination} />

  </>

}
