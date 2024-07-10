


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
import AddressComponent from '../../components/AddressComponent';
import { Safe4_Business_Config } from '../../../config';

const { Title, Text } = Typography;
const Masternodes_Page_Size = 10;

export default ({
  queryMyMasternodes
}: {
  queryMyMasternodes: boolean
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const masternodeStorageContract = useMasternodeStorageContract();
  const multicallContract = useMulticallContract();
  const [masternodes, setMasternodes] = useState<MasternodeInfo[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
  }>();
  const activeAccount = useWalletsActiveAccount();

  useEffect(() => {
    if (masternodeStorageContract) {
      setMasternodes([]);
      if (queryMyMasternodes) {
        // getAddrNum4Creator
        masternodeStorageContract.callStatic.getAddrNum4Creator(activeAccount)
          .then(data => {
            setPagination({
              total: data.toNumber(),
              pageSize: Masternodes_Page_Size,
              current: 1,
            })
          })
      } else {
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
    }
  }, [masternodeStorageContract, activeAccount]);


  useEffect(() => {
    if (pagination && masternodeStorageContract && multicallContract) {
      const { pageSize, current, total } = pagination;
      if (current && pageSize && total) {

        //////////////////// 逆序 ////////////////////////
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
        if (total == 0){
          return;
        }
        setLoading(true);
        if (queryMyMasternodes) {
          masternodeStorageContract.callStatic.getAddrs4Creator(activeAccount , position, offset)
            .then((addresses: any) => {
              loadMasternodeInfos(addresses);
            });
        } else {
          masternodeStorageContract.callStatic.getAll(position, offset)
            .then((addresses: any) => {
              loadMasternodeInfos(addresses);
            });
        }
      }
    }
  }, [pagination])

  const loadMasternodeInfos = useCallback((addresses: string[]) => {
    if (masternodeStorageContract && multicallContract) {
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
          setMasternodes(masternodes.sort((m0: MasternodeInfo, m1: MasternodeInfo) => m1.id - m0.id));
          setLoading(false);
        })
    }
  }, [masternodeStorageContract, multicallContract])

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
                <AddressComponent address={addr} />
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
        const masternodeTarget = CurrencyAmount.ether(ethers.utils.parseEther(Safe4_Business_Config.Masternode.Create.LockAmount + "").toBigInt());
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
    <Table loading={loading} onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current, pageSize, total
      })
    }} dataSource={masternodes} columns={columns} size="large" pagination={pagination} />
  </>
}
