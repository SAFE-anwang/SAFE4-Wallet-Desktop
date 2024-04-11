
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal } from 'antd';
import { ColumnsType, ColumnType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasternodeLogicContract, useMasternodeStorageContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import AddressView from '../../components/AddressView';
import { useDispatch } from 'react-redux';
import { applicationControlVoteSupernode, applicationUpdateSupernodeAddresses } from '../../../state/application/action';
import { ethers } from 'ethers';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import { fetchSuperNodes } from '../../../services/supernode';
import { SuperNodeVO } from '../../../services';
import { useBlockNumber } from '../../../state/application/hooks';
import Supernode from './Supernode';

const { Title, Text } = Typography;

export const RenderNodeState = (state: number) => {
  switch (state) {
    case 0:
      return <Badge status="success" text="初始化" />
    case 1:
      return <Badge status="processing" text="在线" />
    case 2:
      return <Badge status="error" text="异常" />
    default:
      return <Badge status="default" text="未知" />
  }
}

const Supernode_Page_Size = 10;

export default () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const blockNumber = useBlockNumber();
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();
  const [currentMasternodeInfo, setCurrentMasternodeInfo] = useState<MasternodeInfo>();
  const [supernodeVOs, setSupernodeVOs] = useState<SuperNodeVO[]>([]);
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();
  const [loading, setLoading] = useState<boolean>(false);

  const [openSupernodeModal, setOpenSupernodeModal] = useState<boolean>(false);
  const [openSupernodeInfo, setOpenSupernodeInfo] = useState<SupernodeInfo>();

  useEffect(() => {
    if (pagination) {
      const { current, pageSize } = pagination;
      setLoading(true);
      fetchSuperNodes({ current, pageSize })
        .then(data => {
          setSupernodeVOs(data.records);
          setLoading(false);
        })
    }
  }, [pagination, blockNumber])
  useEffect(() => {
    setLoading(true);
    fetchSuperNodes({ current: 1, pageSize: Supernode_Page_Size })
      .then(data => {
        const { current, pageSize, total } = data;
        setPagination({ current, pageSize, total });
      })
  }, []);

  useEffect(() => {
    if (activeAccount && supernodeStorageContract) {
      if (supernodeStorageContract && activeAccount) {
        setCurrentSupernodeInfo(undefined);
        // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
        supernodeStorageContract.callStatic.getInfo(activeAccount)
          .then((_supernode: any) => setCurrentSupernodeInfo(formatSupernodeInfo(_supernode)))
      }
    }
  }, [supernodeStorageContract, activeAccount]);

  useEffect(() => {
    if (activeAccount && masternodeStorageContract) {
      if (masternodeStorageContract && activeAccount) {
        setCurrentMasternodeInfo(undefined);
        // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
        masternodeStorageContract.callStatic.getInfo(activeAccount)
          .then((_masternode: any) => setCurrentMasternodeInfo(formatMasternode(_masternode)))
      }
    }
  }, [masternodeStorageContract, activeAccount]);

  const couldVote = useMemo(() => {
    return (currentSupernodeInfo && currentSupernodeInfo.id == 0);
  }, [currentSupernodeInfo, activeAccount]);

  const columns: ColumnsType<SuperNodeVO> = [
    {
      title: '排名',
      dataIndex: 'id',
      key: '_id',
      render: (id, supernodeVO: SuperNodeVO) => {
        const { state, rank } = supernodeVO;
        return <>
          <Row>
            <Col>
              <Text strong>{rank}</Text>
            </Col>
          </Row>
          <Row>
            <Col>
              <Text>{RenderNodeState(state)}</Text>
            </Col>
          </Row>
        </>
      },
      width: "70px"
    },
    {
      title: '得票数',
      dataIndex: 'id',
      key: '_id',
      render: (_, supernodeVO: SuperNodeVO) => {
        const totalVoteNum = CurrencyAmount.ether(JSBI.BigInt(supernodeVO.totalVoteNum));
        const totalVoteAmount = CurrencyAmount.ether(JSBI.BigInt(supernodeVO.totalVoteAmount));
        return <>
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text strong>{totalVoteNum.toFixed(2)}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type='secondary'>[{totalVoteAmount.toFixed(2)} SAFE]</Text>
            </Col>
          </Row>
          <Row>
            <Progress percent={Number((Number(supernodeVO.voteObtainedRate) * 100).toFixed(2))} status={"normal"} />
          </Row>
        </>
      },
      width: "180px"
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, supernodeVO: SuperNodeVO) => {
        return <>
          <Row>
            <Col>
              <Text title={name} strong style={{ width: "150px" }} ellipsis>
                {name}
              </Text>
            </Col>
          </Row>
          <Row >
            <Col span={24}>
              <Text title={supernodeVO.description} type='secondary' style={{ width: "150px" }} ellipsis>
                {supernodeVO.description}
              </Text>
            </Col>
          </Row>
        </>
      },
      width: "180px"
    },
    {
      title: '超级节点',
      dataIndex: 'addr',
      key: 'addr',
      render: (addr, supernodeVO: SuperNodeVO) => {
        const amount = CurrencyAmount.ether(JSBI.BigInt(supernodeVO.totalAmount))
        const supernodeTarget = CurrencyAmount.ether(ethers.utils.parseEther("5000").toBigInt());
        const couldAddPartner = supernodeTarget.greaterThan(amount);
        const _addr = addr.substring(0, 10) + "...." + addr.substring(addr.length - 8);
        return <>
          <Row>
            <Col span={4}>
              <Text type='secondary'>地址:</Text>
            </Col>
            <Col span={20}>
              <Text strong>
                <AddressView address={_addr}></AddressView>
              </Text>
            </Col>
          </Row>
          <Row>
            <Col span={4}>
              <Text type='secondary'>ID:</Text>
            </Col>
            <Col span={20}>
              <Text>{supernodeVO.id}</Text>
              <Space direction='horizontal' style={{ float: "right" }}>
                {
                  couldAddPartner &&
                  <Button size='small' type='primary' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(supernodeVO.addr));
                    navigate("/main/supernodes/append");
                  }}>加入合伙人</Button>
                }
                {
                  couldVote && !couldAddPartner && <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(supernodeVO.addr));
                    navigate("/main/supernodes/vote");
                  }}>投票</Button>
                }
                <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                  if (supernodeStorageContract) {
                    supernodeStorageContract.callStatic.getInfo(supernodeVO.addr)
                      .then(_supernodeInfo => {
                        setOpenSupernodeInfo(formatSupernodeInfo(_supernodeInfo));
                        setOpenSupernodeModal(true);
                      })
                      .catch(err => {
                      })
                  }
                }}>查看</Button>
              </Space>

            </Col>
          </Row>
        </>
      },
      width: "200px"
    },
  ];

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          超级节点
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type='info' message={<>
            <Text>注册成为超级节点,将不能再注册主节点</Text><br />
            <Text>注册成为超级节点,将不能再使用该账户下的锁仓记录进行超级节点投票</Text><br />
          </>} />
          <Divider />
          {
            (currentSupernodeInfo && currentSupernodeInfo.id == 0 && currentMasternodeInfo && currentMasternodeInfo.id == 0) && <>
              <Button onClick={() => navigate("/main/supernodes/create")}>注册超级节点</Button>
            </>
          }
          {
            currentSupernodeInfo && currentSupernodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是超级节点
              </>} />
            </>
          }
          {
            currentMasternodeInfo && currentMasternodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是主节点
              </>} />
            </>
          }
        </Card>
        <br /><br />
        <Table loading={loading} onChange={(pagination) => {
          const { current, pageSize, total } = pagination;
          setPagination({
            current,
            pageSize,
            total
          })
        }} dataSource={supernodeVOs} columns={columns} size="large" pagination={pagination} />
      </div>
    </div>

    <Modal open={openSupernodeModal} width={1000} footer={null} closable onCancel={() => {
      setOpenSupernodeInfo(undefined);
      setOpenSupernodeModal(false);
    }}>
      {
        openSupernodeInfo && <Supernode supernodeInfo={openSupernodeInfo} />
      }
    </Modal>

  </>
}
