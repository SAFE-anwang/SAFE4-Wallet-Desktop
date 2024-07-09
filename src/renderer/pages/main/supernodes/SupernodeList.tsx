
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal } from 'antd';
import { ColumnsType, ColumnType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMulticallContract, useSupernodeStorageContract, useSupernodeVoteContract } from '../../../hooks/useContracts';
import { formatSupernodeInfo, SupernodeInfo } from '../../../structs/Supernode';
import { useDispatch } from 'react-redux';
import { applicationControlVoteSupernode } from '../../../state/application/action';
import { ethers } from 'ethers';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import Supernode from './Supernode';
import AddressComponent from '../../components/AddressComponent';
import { Safe4_Business_Config } from '../../../config';
import { ZERO } from '../../../utils/CurrentAmountUtils';

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

export function toFixedNoRound(number: number, decimalPlaces: number) {
  const str = number.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) {
    return str;
  }
  const truncatedStr = str.substring(0, decimalIndex + decimalPlaces + 1);
  return parseFloat(truncatedStr).toFixed(decimalPlaces);
}

const Supernode_Page_Size = 10;

export default ({
  queryMySupernodes
}: {
  queryMySupernodes: boolean
}) => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const supernodeStorageContract = useSupernodeStorageContract();
  const supernodeVoteContract = useSupernodeVoteContract();
  const multicallContract = useMulticallContract();
  const activeAccount = useWalletsActiveAccount();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();
  const [supernodes, setSupernodes] = useState<SupernodeInfo[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [openSupernodeModal, setOpenSupernodeModal] = useState<boolean>(false);
  const [openSupernodeInfo, setOpenSupernodeInfo] = useState<SupernodeInfo>();
  const [allVoteNum, setAllVoteNum] = useState<CurrencyAmount>(CurrencyAmount.ether(JSBI.BigInt(1)));

  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();

  useEffect(() => {
    if (supernodeVoteContract) {
      // 获取总得票
      supernodeVoteContract.callStatic.getAllVoteNum()
        .then(data => {
          setAllVoteNum(CurrencyAmount.ether(data));
        });
    }
  }, [supernodeVoteContract])

  useEffect(() => {
    if (supernodeStorageContract) {
      if (queryMySupernodes) {
        // getAddrNum4Creator
        supernodeStorageContract.callStatic.getAddrNum4Creator(activeAccount)
          .then(data => {
            setPagination({
              total: data.toNumber(),
              pageSize: Supernode_Page_Size,
              current: 1,
            })
          });
      } else {
        // function getNum() external view returns (uint);
        supernodeStorageContract.callStatic.getNum()
          .then(data => {
            setPagination({
              total: data.toNumber(),
              pageSize: Supernode_Page_Size,
              current: 1,
            })
          });
      }

    }
  }, [supernodeStorageContract, activeAccount]);

  const loadSupernodeInfoList = useCallback((addresses: string[]) => {
    if (supernodeStorageContract && supernodeVoteContract && multicallContract) {
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      const fragment = supernodeStorageContract.interface.getFunction("getInfo")
      const getInfoCalls = addresses.map((address: string) => [
        supernodeStorageContract.address,
        supernodeStorageContract.interface.encodeFunctionData(fragment, [address])
      ]);
      const getTotalVoteNumFragment = supernodeVoteContract.interface.getFunction("getTotalVoteNum")
      const getTotalVoteNumCalls = addresses.map((address: string) => [
        supernodeVoteContract.address,
        supernodeVoteContract.interface.encodeFunctionData(getTotalVoteNumFragment, [address])
      ]);
      const getTotalAmountFragment = supernodeVoteContract.interface.getFunction("getTotalAmount");
      const getTotalAmountCalls = addresses.map((address: string) => [
        supernodeVoteContract.address,
        supernodeVoteContract.interface.encodeFunctionData(getTotalAmountFragment, [address])
      ]);
      const calls = getInfoCalls.concat(getTotalVoteNumCalls).concat(getTotalAmountCalls);
      multicallContract.callStatic.aggregate(calls)
        .then(data => {
          const multicallDatas = data[1];
          const supernodeInfos = [];
          for (let i = 0; i < multicallDatas.length / 3; i++) {
            const infoRaw = multicallDatas[i];
            const totalVoteNumRaw = multicallDatas[i + (multicallDatas.length / 3)];
            const totalAmountRaw = multicallDatas[i + (multicallDatas.length / 3) * 2];
            const _supernodeInfo = supernodeStorageContract.interface.decodeFunctionResult(fragment, infoRaw)[0];
            const totalVoteNum = supernodeVoteContract.interface.decodeFunctionResult(getTotalVoteNumFragment, totalVoteNumRaw)[0];
            const totalAmount = supernodeVoteContract.interface.decodeFunctionResult(getTotalAmountFragment, totalAmountRaw)[0];
            const supernodeInfo = formatSupernodeInfo(_supernodeInfo);
            supernodeInfo.totalVoteNum = CurrencyAmount.ether(JSBI.BigInt(totalVoteNum));
            supernodeInfo.totalAmount = CurrencyAmount.ether(JSBI.BigInt(totalAmount));
            supernodeInfos.push(supernodeInfo);
          }
          setSupernodes(supernodeInfos);
          setLoading(false);
        })
    }
  }, [supernodeStorageContract, supernodeVoteContract, multicallContract]);

  useEffect(() => {
    if (pagination && supernodeStorageContract && supernodeVoteContract && multicallContract) {
      const { pageSize, current, total } = pagination;
      if (current && pageSize && total) {
        setLoading(true);
        //////////////////// 正序 ////////////////////////
        let _position = (current - 1) * pageSize;
        let _offset = pageSize;
        /////////////////////////////////////////////////
        //////////////////// 逆序 ////////////////////////
        let position = total - (pageSize * current);
        let offset = pageSize;
        if (position < 0) {
          offset = pageSize + position;
          position = 0;
        }
        //////////////////////////////////////////////////
        if (queryMySupernodes) {
          // getAddrs4Creator:
          supernodeStorageContract.callStatic.getAddrs4Creator(activeAccount, _position, _offset)
            .then((addresses: any) => {
              loadSupernodeInfoList(addresses)
            });
        } else {
          supernodeStorageContract.callStatic.getAll(_position, _offset)
            .then((addresses: any) => {
              loadSupernodeInfoList(addresses)
            });
        }
      }
    }
  }, [pagination, activeAccount])

  const couldVote = useMemo(() => {
    return (currentSupernodeInfo && currentSupernodeInfo.id == 0);
  }, [currentSupernodeInfo, activeAccount]);

  const columns: ColumnsType<SupernodeInfo> = [
    {
      title: queryMySupernodes ? '状态' : '排名',
      dataIndex: 'id',
      key: '_id',
      render: (id, supernodeInfo: SupernodeInfo) => {
        const { state } = supernodeInfo;
        const rank = (pagination && pagination.current && pagination.pageSize ? (pagination.current - 1) * pagination.pageSize : 0)
          + (supernodes.indexOf(supernodeInfo) + 1)
        return <>
          <Row>
            <Col>
              {
                !queryMySupernodes && <Text strong>{rank}</Text>
              }
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
      render: (_, supernodeInfo: SupernodeInfo) => {
        const { totalAmount, totalVoteNum } = supernodeInfo;
        const voteObtainedRate = totalVoteNum?.divide(allVoteNum).toFixed(6);
        return <>
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text strong>{totalVoteNum?.toFixed(2)}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type='secondary'>[{totalAmount?.toFixed(2)} SAFE]</Text>
            </Col>
          </Row>
          <Row>
            <Progress percent={Number(toFixedNoRound((Number(voteObtainedRate) * 100), 1))} status={"normal"} />
          </Row>
        </>
      },
      width: "180px"
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, supernodeVO: SupernodeInfo) => {
        return <>
          <Row>
            <Col>
              <Text title={name} strong style={{ width: "180px" }} ellipsis>
                {name}
              </Text>
            </Col>
          </Row>
          <Row >
            <Col span={24}>
              <Text title={supernodeVO.description} type='secondary' style={{ width: "180px", display: "block" }} ellipsis>
                {supernodeVO.description}
              </Text>
            </Col>
          </Row>
        </>
      },
      width: "160px"
    },
    {
      title: '超级节点',
      dataIndex: 'addr',
      key: 'addr',
      render: (addr, supernodeInfo: SupernodeInfo) => {
        const { id, founders } = supernodeInfo;
        const amount = founders.map(founder => founder.amount).reduce((a0, a1) => { return a0.add(a1) }, ZERO);
        const supernodeTarget = CurrencyAmount.ether(ethers.utils.parseEther(Safe4_Business_Config.Supernode.Create.LockAmount + "").toBigInt());
        const couldAddPartner = supernodeTarget.greaterThan(amount);
        const _addr = addr.substring(0, 10) + "...." + addr.substring(addr.length - 8);
        return <>
          <Row>
            <Col span={4}>
              <Text type='secondary'>地址:</Text>
            </Col>
            <Col span={20}>
              <Text strong>
                <AddressComponent address={addr} ellipsis copyable />
              </Text>
            </Col>
          </Row>
          <Row>
            <Col span={4}>
              <Text type='secondary'>ID:</Text>
            </Col>
            <Col span={20}>
              <Text>{id}</Text>
              <Space direction='horizontal' style={{ float: "right" }}>
                {
                  couldAddPartner &&
                  <Button size='small' type='primary' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(addr));
                    navigate("/main/supernodes/append");
                  }}>加入合伙人</Button>
                }
                {
                  couldVote && !couldAddPartner && <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(addr));
                    navigate("/main/supernodes/vote");
                  }}>投票</Button>
                }
                <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                  if (supernodeStorageContract) {
                    supernodeStorageContract.callStatic.getInfo(addr)
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
    <Table loading={loading} onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current,
        pageSize,
        total
      })
    }} dataSource={supernodes} columns={columns} size="large" pagination={pagination} />
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
