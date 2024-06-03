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
import { FileAddOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;

const Supernode_Page_Size = 10;

export default () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

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
        const _addr = creator ? creator.substring(0, 10) + "...." + creator.substring(creator.length - 8) : "";
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
        const { } = contractVO;
        return <>
          <Row>
            <Col span={24} style={{ width: "80px" }}>
              <Text>{name}</Text>
              <Button style={{float:"right"}} onClick={() => {
                dispatch( applicationControlContractVO(contractVO) )
                navigate("/main/contracts/detail")
              }}>查看</Button>
            </Col>
          </Row>
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

        <Row style={{marginBottom:"20px"}}>
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
