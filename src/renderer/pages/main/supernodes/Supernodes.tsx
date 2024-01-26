
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider } from 'antd';
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

const { Title, Text, Paragraph } = Typography;

export const RenderNodeState = (state: number) => {
  switch (state) {
    case 1:
      return <Badge status="processing" text="在线" />
    default:
      return <Badge status="default" text="未知" />
  }
}

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const supernodeStorageContract = useSupernodeStorageContract();
  const [supernodeInfos, setSupernodeInfos] = useState<(SupernodeInfo)[]>([]);
  const [totalVotedAmount, setTotalVotedAmount] = useState<CurrencyAmount>();
  const activeAccount = useWalletsActiveAccount();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();
  const [currentMasternodeInfo, setCurrentMasternodeInfo] = useState<MasternodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();

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
    console.log("current :" , currentSupernodeInfo)
    return currentSupernodeInfo == undefined;
  }, [currentSupernodeInfo , activeAccount]);

  const columns: ColumnsType<SupernodeInfo> = [
    {
      title: '排名',
      dataIndex: 'id',
      key: '_id',
      render: (id, supernodeInfo: SupernodeInfo) => {
        const { state } = supernodeInfo.stateInfo;
        return <>
          <Row>
            <Col>
              <Text strong>{supernodeInfos.indexOf(supernodeInfo) + 1}</Text>
            </Col>
          </Row>
          <Row>
            <Col>
              <Text>{RenderNodeState(state)}</Text>
            </Col>
          </Row>
        </>
      },
      width: "50px"
    },
    {
      title: '得票数',
      dataIndex: 'id',
      key: '_id',
      render: (_, supernodeInfo: SupernodeInfo) => {
        let percent = 0;
        const totalVotedSafeAmount = supernodeInfo.voteInfo.voters.reduce<CurrencyAmount>(
          (totalVotedSafeAmount, memberInfo) => totalVotedSafeAmount.add(memberInfo.amount),
          CurrencyAmount.ether(JSBI.BigInt(0))
        );
        if (totalVotedAmount && totalVotedAmount.greaterThan(JSBI.BigInt(0))) {
          percent = Number(
            supernodeInfo.voteInfo.totalAmount.divide(totalVotedAmount).multiply(JSBI.BigInt(100)).toFixed(1)
          )
        }
        return <>
          <Row>
            <Col span={12} style={{ textAlign: "left" }}>
              <Text strong>{supernodeInfo.voteInfo.totalAmount.toFixed(2)}</Text>
            </Col>
            <Col span={12} style={{ textAlign: "right" }}>
              <Text type='secondary'>[{totalVotedSafeAmount.toFixed(2)} SAFE]</Text>
            </Col>
          </Row>
          <Row>
            <Progress percent={percent} status={"normal"} />
          </Row>
        </>
      },
      width: "180px"
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, supernodeInfo: SupernodeInfo) => {
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
              <Text title={supernodeInfo.description} type='secondary' style={{ width: "150px" }} ellipsis>
                {supernodeInfo.description}
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
      render: (addr, supernodeInfo: SupernodeInfo) => {
        const amount = supernodeInfo.founders.reduce<CurrencyAmount>(
          (amount, memberInfo) => amount.add(memberInfo.amount),
          CurrencyAmount.ether(JSBI.BigInt(0))
        )
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
              <Text>{supernodeInfo.id}</Text>
              <Space direction='horizontal' style={{ float: "right" }}>
                {
                  couldAddPartner &&
                  <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(supernodeInfo.addr));
                    navigate("/main/supernodes/append");
                  }}>加入合伙人</Button>
                }
                {
                  couldVote && <Button size='small' type='primary' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlVoteSupernode(supernodeInfo.addr));
                    navigate("/main/supernodes/vote");
                  }}>投票</Button>
                }
              </Space>

            </Col>
          </Row>
        </>
      },
      width: "200px"
    },
  ];

  useEffect(() => {
    if (supernodeStorageContract) {
      supernodeStorageContract.callStatic.getAll()
        .then(_supernodeInfos => {
          const supernodeInfos: SupernodeInfo[] = _supernodeInfos.map(formatSupernodeInfo);
          supernodeInfos.sort((s1, s2) => s2.voteInfo.totalAmount.greaterThan(s1.voteInfo.totalAmount) ? 1 : -1)
          // 计算每个超级节点内创建时抵押的 SAFE 数量.
          setCurrentSupernodeInfo(undefined);
          supernodeInfos.forEach((supernode: SupernodeInfo) => {
            const totalFoundersAmount = supernode.founders.reduce<CurrencyAmount>(
              (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
              CurrencyAmount.ether(JSBI.BigInt("0"))
            );
            if (activeAccount == supernode.addr) {
              setCurrentSupernodeInfo(supernode);
            }
          });
          // 计算当前网络投票的所有投票价值.
          const totalVotedAmount = supernodeInfos.reduce<CurrencyAmount>(
            (totalVotedAmount, supernodeInfo) => totalVotedAmount.add(supernodeInfo.voteInfo.totalAmount),
            CurrencyAmount.ether(JSBI.BigInt("0"))
          );
          // 更新超级节点地址集合到state
          dispatch(applicationUpdateSupernodeAddresses(supernodeInfos.map(supernodeInfo => supernodeInfo.addr)));
          setTotalVotedAmount(totalVotedAmount);
          setSupernodeInfos(supernodeInfos);
        }).catch(err => {

        });
    }
  }, [supernodeStorageContract, activeAccount])

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
            !currentSupernodeInfo && currentMasternodeInfo && currentMasternodeInfo.id == 0 && <>
              <Button onClick={() => navigate("/main/supernodes/create")}>注册超级节点</Button>
            </>
          }
          {
            currentSupernodeInfo && <>
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
        <Table dataSource={supernodeInfos} columns={columns} size="large" pagination={{ total: supernodeInfos.length, pageSize: 10 }} />
      </div>
    </div>
  </>
}
