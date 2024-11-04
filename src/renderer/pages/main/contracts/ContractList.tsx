import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useEffect, useState } from 'react';
import { fetchContracts } from '../../../services/contracts';
import { ContractVO } from '../../../services';
import { ColumnsType } from 'antd/es/table';
import { DateTimeFormat } from '../../../utils/DateUtils';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { applicationControlContractVO } from '../../../state/application/action';
import { CheckCircleTwoTone, FileAddOutlined, QuestionCircleFilled, QuestionCircleTwoTone, QuestionOutlined, WalletTwoTone } from '@ant-design/icons';
import useSafeScan from '../../../hooks/useSafeScan';
import AddressComponent from '../../components/AddressComponent';
import { useTranslation } from 'react-i18next';
const { Title, Text } = Typography;

const Supernode_Page_Size = 10;

export default ({
  localContracts,
  queryContracts
}: {
  localContracts: any[];
  queryContracts: boolean;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<any[]>(localContracts);
  const [contractVOs, setContractVOs] = useState<ContractVO[]>([]);
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();
  const [loading, setLoading] = useState<boolean>(false);
  const { API } = useSafeScan();

  useEffect(() => {
    if (contracts && queryContracts) {
      setLoading(true);
      fetchContracts(API, { current: 1, pageSize: Supernode_Page_Size })
        .then(data => {
          const { current, pageSize, total } = data;
          setPagination({ current, pageSize, total });
        })
    } else {
      setContractVOs(contracts.filter(localContract => {
        return localContract.addedTime && localContract.transactionHash
      }).sort((c0, c1) => {
        return c1.addedTime - c0.addedTime;
      }).map(localContract => {
        return {
          ...localContract,
          creatorTimestamp: localContract.addedTime / 1000
        }
      }));
    }
  }, [contracts, queryContracts]);

  useEffect(() => {
    if (pagination && queryContracts) {
      const { current, pageSize } = pagination;
      setLoading(true);
      fetchContracts(API, { current, pageSize })
        .then(data => {
          setContractVOs(data.records);
          setLoading(false);
        })
    }
  }, [pagination, queryContracts]);

  const columns: ColumnsType<ContractVO> = [
    {
      title: t("wallet_contracts_address"),
      dataIndex: 'address',
      key: 'address',
      render: (address, contractVO: ContractVO) => {
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              <AddressComponent address={address} ellipsis copyable />
            </Col>
          </Row>
        </>
      },
      width: "80px"
    },
    {
      title: t("wallet_contracts_creator"),
      dataIndex: 'creator',
      key: 'creator',
      render: (creator, supernodeVO: ContractVO) => {
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              {
                creator && <AddressComponent address={creator} ellipsis copyable />
              }
              {
                !creator && <Text strong>GENESIS</Text>
              }
            </Col>
          </Row>
        </>
      },
      width: "80px"
    },
    {
      title: t("wallet_contracts_deploytime"),
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
      width: "50px"
    },
    {
      title: t("wallet_contracts_name"),
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
            <Col span={24} style={{ width: "100px" }}>
              <Row>
                <Col span={16}>
                  {
                    !name && dbName && <>
                      <Col span={2} style={{ paddingTop: "5px", float: "left" }}>
                        <Tooltip title={t("wallet_contracts_localdeploy")}>
                          <QuestionCircleTwoTone style={{ cursor: "pointer" }} twoToneColor='#7e7e7e' />
                        </Tooltip>
                      </Col>
                      <Col span={20} style={{ paddingTop: "5px", float: "left" }}>
                        <Text title={dbName} ellipsis style={{ marginLeft: "6px" }} type='secondary' italic>{dbName}</Text>
                      </Col>
                    </>
                  }
                  {
                    name && <>
                      <Col span={2} style={{ paddingTop: "5px", float: "left" }}>
                        {
                          queryContracts && <Tooltip title={t("wallet_contracts_opensource")}>
                            <CheckCircleTwoTone style={{ cursor: "pointer" }} twoToneColor='#74d13be0' />
                          </Tooltip>
                        }

                      </Col>
                      <Col span={22} style={{ paddingTop: "5px", float: "left" }}>
                        <Text title={name} ellipsis style={{ marginLeft: "6px" }} strong>{name}</Text>
                      </Col>
                    </>
                  }
                </Col>
                <Col span={8}>
                  <Button style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlContractVO(contractVO))
                    navigate("/main/contracts/detail")
                  }}>{t("view")}</Button>
                </Col>
              </Row>
            </Col>
          </Row >
        </>
      },
      width: "120px"
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
    }} dataSource={contractVOs} columns={columns} size="large" pagination={pagination} />

  </>

}
