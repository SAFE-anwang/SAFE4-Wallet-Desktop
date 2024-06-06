import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useEffect, useState } from 'react';
import { fetchContracts } from '../../../services/contracts';
import { ContractVO } from '../../../services';
import { ColumnsType } from 'antd/es/table';
import AddressView from '../../components/AddressView';
import { DateTimeFormat } from '../../../utils/DateUtils';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { applicationControlContractVO } from '../../../state/application/action';
import { CheckCircleTwoTone, FileAddOutlined, QuestionCircleFilled, QuestionCircleTwoTone, QuestionOutlined, WalletTwoTone } from '@ant-design/icons';
import { useWeb3React } from '@web3-react/core';
import { ContractCompileSignal, ContractCompile_Methods } from '../../../../main/handlers/ContractCompileHandler';
import { IPC_CHANNEL } from '../../../config';
import { useWalletsList } from '../../../state/wallets/hooks';
const { Title, Text } = Typography;

const Supernode_Page_Size = 10;

export default () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();
  const [contracts, setContracts] = useState<any[]>();
  const walletsList = useWalletsList();

  useEffect(() => {
    if (chainId) {
      const method = ContractCompile_Methods.getAll;
      window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ContractCompileSignal, method, [
        chainId
      ]]);
      window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
        if (arg instanceof Array && arg[0] == ContractCompileSignal && arg[1] == method) {
          const data = arg[2][0];
          const contracts = data.map((contractDB: any) => {
            const { id, address, creator, chain_id, transaction_hash, source_code, abi, bytecode, name } = contractDB;
            return {
              id, address, creator, abi, bytecode, name,
              chainId: chain_id,
              transactionHash: transaction_hash,
              sourceCode: source_code
            }
          });
          console.log("load contracts from sqlite3 >>", contracts);
          setContracts(contracts);
        }
      });
    }
  }, [chainId]);

  const [contractVOs, setContractVOs] = useState<ContractVO[]>([]);
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (contracts) {
      setLoading(true);
      fetchContracts({ current: 1, pageSize: Supernode_Page_Size })
        .then(data => {
          const { current, pageSize, total } = data;
          setPagination({ current, pageSize, total });
        })
    }
  }, [contracts]);

  useEffect(() => {
    if (pagination) {
      const { current, pageSize } = pagination;
      setLoading(true);
      fetchContracts({ current, pageSize })
        .then(data => {
          setContractVOs(data.records);
          setLoading(false);
        })
    }
  }, [pagination]);

  const columns: ColumnsType<ContractVO> = [
    {
      title: '合约地址',
      dataIndex: 'address',
      key: 'address',
      render: (address, contractVO: ContractVO) => {
        const { } = contractVO;
        const _addr = address.substring(0, 10) + "..." + address.substring(address.length - 8);
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              <AddressView address={_addr}></AddressView>
            </Col>
          </Row>
        </>
      },
      width: "80px"
    },
    {
      title: '创建账户',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator, supernodeVO: ContractVO) => {
        const { } = supernodeVO;
        const _addr = creator ? creator.substring(0, 10) + "..." + creator.substring(creator.length - 8) : "";
        let isLocalCreator = false;
        walletsList.forEach((wallet) => {
          if (wallet.address == creator) {
            isLocalCreator = true;
          }
        })
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              {
                !isLocalCreator && <Text>
                  <AddressView address={_addr}></AddressView>
                </Text>
              }
              {
                isLocalCreator && <Row>
                  <Col span={20}>
                    <Text style={{ color: "#4780e1e0" }} italic>
                      <AddressView address={_addr}></AddressView>
                    </Text>
                  </Col>
                  <Tooltip title="本地钱包">
                    <WalletTwoTone style={{ float: "right" }} />
                  </Tooltip>
                </Row>
              }
            </Col>
          </Row>
        </>
      },
      width: "80px"
    },
    {
      title: '部署时间',
      dataIndex: 'creatorTimestamp',
      key: 'creatorTimestamp',
      render: (creatorTimestamp, contractVO: ContractVO) => {
        const { creator } = contractVO;
        return <>
          <Row>
            <Col span={24} style={{ width: "60px" }}>
              {
                creator && <Text>{DateTimeFormat(creatorTimestamp * 1000)}</Text>
              }
            </Col>
          </Row>
        </>
      },
      width: "60px"
    },
    {
      title: '合约名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, contractVO: ContractVO) => {
        const { creator, creatorTransactionHash } = contractVO;
        let dbName = undefined;
        if (contracts) {
          contracts.forEach(contract => {
            if (contract.creator == creator && contract.transactionHash == creatorTransactionHash) {
              dbName = contract.name;
            }
          })
        }
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              <Row>
                <Col span={16}>
                  {
                    !name && dbName && <>
                      <Col span={24} style={{ paddingTop: "5px" }}>
                        <Tooltip title="该合约通过本地钱包部署,但未在浏览器开源合约源码">
                          <QuestionCircleTwoTone style={{ cursor: "pointer" }} twoToneColor='#7e7e7e' />
                        </Tooltip>
                        <Text style={{ marginLeft: "6px" }} type='secondary' italic>{dbName}</Text>
                      </Col>
                    </>
                  }
                  {
                    name && <>
                      <Col span={24} style={{ paddingTop: "5px" }}>
                        <Tooltip title="已进行开源验证的智能合约">
                          <CheckCircleTwoTone style={{ cursor: "pointer" }} twoToneColor='#74d13be0' />
                        </Tooltip>
                        <Text style={{ marginLeft: "6px" }} strong>{name}</Text>
                      </Col>
                    </>
                  }
                </Col>
                <Col span={8}>
                  <Button style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlContractVO(contractVO))
                    navigate("/main/contracts/detail")
                  }}>查看</Button>
                </Col>
              </Row>
            </Col>
          </Row >
        </>
      },
      width: "100px"
    },
  ];

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          智能合约
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            注册成为主节点，则不能再注册成为超级节点
          </>} />
        </Card>

        <Row style={{ marginBottom: "20px" }}>
          <Col span={24}>
            <Button icon={<FileAddOutlined />} type='primary' onClick={() => navigate("/main/contracts/edit")}>部署合约</Button>
          </Col>
        </Row>

        <Table loading={loading} onChange={(pagination) => {
          const { current, pageSize, total } = pagination;
          setPagination({
            current,
            pageSize,
            total
          })
        }} dataSource={contractVOs} columns={columns} size="large" pagination={pagination} />
      </div>
    </div>

  </>

}
