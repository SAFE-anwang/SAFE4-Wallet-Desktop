import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table } from 'antd';
import { useEffect, useState } from 'react';
import { fetchContracts } from '../../../services/contracts';
import { ContractVO } from '../../../services';
import { ColumnsType } from 'antd/es/table';
import AddressView from '../../components/AddressView';
import { DateTimeFormat } from '../../../utils/DateUtils';
const { Title, Text } = Typography;

const Supernode_Page_Size = 10;

export default () => {

  const [contractVOs, setContractVOs] = useState<ContractVO[]>([]);
  const [pagination, setPagination] = useState<{
    current?: number,
    pageSize?: number,
    total?: number
  }>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetchContracts({ current: 1, pageSize: Supernode_Page_Size })
      .then(data => {
        const { current, pageSize, total } = data;
        setPagination({ current, pageSize, total });
      })
  }, []);
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
        const _addr = address.substring(0, 10) + "...." + address.substring(address.length - 8);
        return <>
          <AddressView address={_addr}></AddressView>
        </>
      },
    },
    {
      title: '创建账户',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator, supernodeVO: ContractVO) => {
        const { } = supernodeVO;
        const _addr = creator ? creator.substring(0, 10) + "...." + creator.substring(creator.length - 8) : "";
        return <>
          <Row>
            <Col>
              <AddressView address={_addr}></AddressView>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: '部署时间',
      dataIndex: 'creatorTimestamp',
      key: 'creatorTimestamp',
      render: (creatorTimestamp, supernodeVO: ContractVO) => {
        const { } = supernodeVO;
        return <>
          <Row>
            <Col>
              <Text>   {DateTimeFormat(creatorTimestamp * 1000)} </Text>
            </Col>
          </Row>
        </>
      },
    },
    {
      title: '合约名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, supernodeVO: ContractVO) => {
        const { } = supernodeVO;
        return <>
          <Row>
            <Col>
              <Text>{name}</Text>
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
