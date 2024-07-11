


import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Input } from 'antd';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import Table, { ColumnsType } from 'antd/es/table';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { applicationControlAppendMasternode } from '../../../state/application/action';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import { RenderNodeState } from '../supernodes/Supernodes';
import AddressComponent from '../../components/AddressComponent';
import { Safe4_Business_Config } from '../../../config';
import EditMasternode from './EditMasternode';
import { useBlockNumber } from '../../../state/application/hooks';
import Masternode from './Masternode';

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

  const [openEditMasternodeModal, setOpenEditMasternodeModal] = useState<boolean>(false);
  const [openEditMasternodeInfo, setOpenEditMasternodeInfo] = useState<MasternodeInfo>();
  const [openMasternodeModal, setOpenMasternodeModal] = useState<boolean>(false);
  const [openMasternodeInfo, setOpenMasternodeInfo] = useState<MasternodeInfo>();

  const [queryKey, setQueryKey] = useState<string>();
  const [queryKeyError, setQueryKeyError] = useState<string>();

  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
  }>();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();

  useEffect(() => {
    if (masternodeStorageContract) {
      if ((pagination && pagination.current && pagination.current > 1)) {
        return;
      }
      if (queryMyMasternodes) {
        // getAddrNum4Creator
        masternodeStorageContract.callStatic.getAddrNum4Creator(activeAccount)
          .then(data => {
            if (data.toNumber() == 0) {
              setMasternodes([]);
            }
            setPagination({
              total: data.toNumber(),
              pageSize: Masternodes_Page_Size,
              current: 1,
            })
          })
      } else {
        if (queryKey) {
          doSearch();
          return;
        }
        // function getNum() external view returns (uint);
        masternodeStorageContract.callStatic.getNum()
          .then(data => {
            if (data.toNumber() == 0) {
              setMasternodes([]);
            }
            setPagination({
              total: data.toNumber(),
              pageSize: Masternodes_Page_Size,
              current: 1,
            })
          })
      }
    }
  }, [masternodeStorageContract, activeAccount, blockNumber, queryKey]);


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
        if (total == 0) {
          return;
        }
        setLoading(true);
        if (queryMyMasternodes) {
          masternodeStorageContract.callStatic.getAddrs4Creator(activeAccount, position, offset)
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
                    if (couldAddPartner) {
                      dispatch(applicationControlAppendMasternode(masternodeInfo.addr))
                      navigate("/main/masternodes/append")
                    } else {
                      setOpenMasternodeInfo(masternodeInfo);
                      setOpenMasternodeModal(true);
                    }
                  }}>
                  {couldAddPartner ? "加入合伙人" : "查看"}
                </Button>
                {
                  queryMyMasternodes &&
                  <Button size='small' style={{ float: "right" }}
                    onClick={() => {
                      setOpenEditMasternodeInfo(masternodeInfo);
                      setOpenEditMasternodeModal(true);
                    }}>
                    编辑
                  </Button>
                }
              </Space>
            </Col>
          </Row>
        </>
      },
    },
  ];

  const doSearch = useCallback(async () => {
    if (masternodeStorageContract && queryKey) {
      if (queryKey.indexOf("0x") == 0) {
        // do query as Address ;
        if (ethers.utils.isAddress(queryKey)) {
          const addr = queryKey;
          setLoading(true);
          const exist = await masternodeStorageContract.callStatic.exist(addr);
          if (exist) {
            const _masternodeInfo = await masternodeStorageContract.callStatic.getInfo(addr);
            console.log(_masternodeInfo)
            const masternodeInfo = formatMasternode(_masternodeInfo);
            setMasternodes([masternodeInfo]);
            setPagination(undefined);
            setLoading(false);
          } else {
            setMasternodes([]);
            setPagination(undefined);
            setQueryKeyError("主节点地址不存在");
            setLoading(false);
          }
        } else {
          setQueryKeyError("请输入合法的主节点地址");
        }
      } else {
        const id = Number(queryKey);
        if (id) {
          setLoading(true);
          const exist = await masternodeStorageContract.callStatic.existID(id);
          if (exist) {
            const _masternodeInfo = await masternodeStorageContract.callStatic.getInfoByID(id);
            const masternodeInfo = formatMasternode(_masternodeInfo);
            setMasternodes([masternodeInfo]);
            setPagination(undefined);
            setLoading(false);
          } else {
            setMasternodes([]);
            setPagination(undefined);
            setQueryKeyError("主节点ID不存在");
            setLoading(false);
          }
        } else {
          setQueryKeyError("请输入合法的主节点ID或地址");
        }
      }
    }
  }, [masternodeStorageContract, queryKey]);

  return <>
    {
      !queryMyMasternodes &&
      <Row style={{ marginBottom: "20px" }}>
        <Col span={12}>
          <Input.Search size='large' placeholder='主节点ID｜主节点地址' onChange={(event) => {
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

    <Table loading={loading} onChange={(pagination) => {
      const { current, pageSize, total } = pagination;
      setPagination({
        current, pageSize, total
      })
    }} dataSource={masternodes} columns={columns} size="large" pagination={pagination} />

    <Modal destroyOnClose open={openMasternodeModal} width={1000} footer={null} closable onCancel={() => {
      setOpenMasternodeInfo(undefined);
      setOpenMasternodeModal(false);
    }}>
      {
        openMasternodeInfo && <Masternode masternodeInfo={openMasternodeInfo} />
      }
    </Modal>

    <Modal destroyOnClose open={openEditMasternodeModal} width={800} footer={null} closable onCancel={() => {
      setOpenEditMasternodeInfo(undefined);
      setOpenEditMasternodeModal(false);
    }}>
      {
        openEditMasternodeInfo && <EditMasternode masternodeInfo={openEditMasternodeInfo} />
      }
    </Modal>

  </>
}
