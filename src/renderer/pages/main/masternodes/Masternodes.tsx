
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import Table, { ColumnsType } from 'antd/es/table';
import AddressView from '../../components/AddressView';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { applicationControlAppendMasternode } from '../../../state/application/action';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { SupernodeInfo, formatSupernodeInfo } from '../../../structs/Supernode';
import { RenderNodeState } from '../supernodes/Supernodes';

const { Title, Text } = Typography;
const Masternodes_Page_Size = 10;

export default () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const masternodeStorageContract = useMasternodeStorageContract();
  const supernodeStorageContract = useSupernodeStorageContract();
  const multicallContract = useMulticallContract();
  const [masternodes, setMasternodes] = useState<MasternodeInfo[]>();
  const activeAccount = useWalletsActiveAccount();
  const [currentMasternodeInfo, setCurrentMasternodeInfo] = useState<MasternodeInfo>();
  const [currentSupernodeInfo, setCurrentSupernodeInfo] = useState<SupernodeInfo>();
  const [loading, setLoading] = useState<boolean>(false);

  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
  }>();

  useEffect(() => {
    if (masternodeStorageContract) {
      // function getNum() external view returns (uint);
      masternodeStorageContract.callStatic.getNum()
        .then(data => {
          setPagination({
            total: data.toNumber(),
            pageSize: Masternodes_Page_Size,
            current: 1,
          })
        })
    }
  }, [masternodeStorageContract]);


  useEffect(() => {
    if (pagination && masternodeStorageContract && multicallContract) {
      const { pageSize, current, total } = pagination;
      if (current && pageSize) {
        setLoading(true);
        masternodeStorageContract.callStatic.getAll((current - 1) * pageSize, pageSize)
          .then((addresses: any) => {
            // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
            const fragment = masternodeStorageContract.interface.getFunction("getInfo")
            const calls = addresses.map((address: string) => [
              masternodeStorageContract.address,
              masternodeStorageContract.interface.encodeFunctionData(fragment, [address])
            ])
            multicallContract.callStatic.aggregate(calls)
              .then(data => {
                const masternodes = data[1].map((raw: string) => {
                  const _masternode = masternodeStorageContract.interface.decodeFunctionResult(fragment, raw)[0];
                  return formatMasternode(_masternode);
                })
                // then set masternodes ...
                setMasternodes(masternodes);
                setLoading(false);
              })
          });
      }
    }
  }, [pagination])


  useEffect(() => {
    if (masternodeStorageContract && activeAccount) {
      setCurrentMasternodeInfo(undefined);
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      masternodeStorageContract.callStatic.getInfo(activeAccount)
        .then((_masternode: any) => setCurrentMasternodeInfo(formatMasternode(_masternode)))
    }
  }, [masternodeStorageContract, activeAccount])

  useEffect(() => {
    if (supernodeStorageContract && activeAccount) {
      setCurrentSupernodeInfo(undefined);
      // function getInfo(address _addr) external view returns (MasterNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(activeAccount)
        .then((_masternode: any) => setCurrentSupernodeInfo(formatSupernodeInfo(_masternode)))
    }
  }, [supernodeStorageContract, activeAccount]);

  const columns: ColumnsType<MasternodeInfo> = [
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      render: (state) => {
        return <>
          <Row>
            <Col span={20}>
              {RenderNodeState(state)}
            </Col>
          </Row>
        </>
      },
    },
    {
      title: '节点ID',
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
      title: '主节点地址',
      dataIndex: 'addr',
      key: 'addr',
      render: (addr) => {
        return <>
          <Row>
            <Col span={20}>
              <Text strong>
                <AddressView address={addr}></AddressView>
              </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: '质押SAFE',
      dataIndex: 'id',
      key: '_id2',
      width: "300px",
      render: (id, masternodeInfo: MasternodeInfo) => {
        const amount = masternodeInfo.founders.reduce<CurrencyAmount>(
          (amount, memberInfo) => amount.add(memberInfo.amount),
          CurrencyAmount.ether(JSBI.BigInt(0))
        )
        const masternodeTarget = CurrencyAmount.ether(ethers.utils.parseEther("1000").toBigInt());
        const couldAddPartner = masternodeTarget.greaterThan(amount);
        return <>
          <Row>
            <Col span={12}>
              {amount.toFixed(2)} SAFE
            </Col>
            <Col span={12}>
              <Space direction='horizontal' style={{ float: "right" }}>
                <Button size='small' style={{ float: "right" }}
                  type={couldAddPartner ? "primary" : "default"}
                  onClick={() => {
                    dispatch(applicationControlAppendMasternode(masternodeInfo.addr))
                    navigate("/main/masternodes/append")
                  }}>
                  {couldAddPartner ? "加入合伙人" : "查看"}
                </Button>
              </Space>
            </Col>
          </Row>
        </>
      },
    },
  ];

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          主节点
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            注册成为主节点，则不能再注册成为超级节点
          </>} />
          <Divider />
          {
            currentMasternodeInfo && currentMasternodeInfo.id != 0 && <>
              <Alert showIcon type='warning' message={<>
                已经是主节点
              </>} />
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
            currentMasternodeInfo && currentMasternodeInfo.id == 0 &&
            currentSupernodeInfo && currentSupernodeInfo.id == 0 && <>
              <Button onClick={() => { navigate("/main/masternodes/register") }}>注册主节点</Button>
            </>
          }
        </Card>

        <Table loading={loading} onChange={(pagination) => {
          const { current, pageSize, total } = pagination;
          setPagination({
            current, pageSize, total
          })
        }} dataSource={masternodes} columns={columns} size="large" pagination={pagination} />
      </div>
    </div>
  </>
}
