
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space } from 'antd';
import { useMasternodeStorageContract } from '../../../hooks/useContracts';
import { useEffect, useState } from 'react';
import { MasternodeInfo, formatMasternode } from '../../../structs/Masternode';
import Table, { ColumnsType } from 'antd/es/table';
import AddressView from '../../components/AddressView';
import { CurrencyAmount, JSBI } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { applicationControlAppendMasternode } from '../../../state/application/action';


const { Title, Text, Paragraph } = Typography;

export default () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const masternodeStorageContract = useMasternodeStorageContract();
  const [masternodes, setMasternodes] = useState<MasternodeInfo[]>();
  useEffect(() => {
    if (masternodeStorageContract) {
      // function getAll() external view returns (MasterNodeInfo[] memory);
      masternodeStorageContract.callStatic.getAll()
        .then((_masternodes: any) => {
          const masternodes: MasternodeInfo[] = _masternodes.map(formatMasternode);
          masternodes.sort((m1, m2) => m2.id - m1.id)
          console.log("load masternodes >>", masternodes)
          setMasternodes(masternodes);
        });
    }
  }, [masternodeStorageContract]);

  const RenderNodeState = (state: number) => {
    switch (state) {
      case 1:
        return <Badge status="processing" text="在线" />
      default:
        return <Badge status="default" text="未知" />
    }
  }

  const columns: ColumnsType<MasternodeInfo> = [
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      render: (state, supernodeInfo: MasternodeInfo) => {
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
      title: '主节点ID',
      dataIndex: 'id',
      key: '_id',
      render: (id, supernodeInfo: MasternodeInfo) => {
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
      render: (addr, supernodeInfo: MasternodeInfo) => {
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
                {
                  couldAddPartner &&
                  <Button size='small' type='default' style={{ float: "right" }} onClick={() => {
                    dispatch(applicationControlAppendMasternode(masternodeInfo.addr))
                    navigate("/main/masternodes/append")
                  }}>加入合伙人</Button>
                }
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
        <Button style={{marginBottom:"20px"}} onClick={()=>{navigate("/main/masternodes/register")}}>成为主节点</Button>
        <Table dataSource={masternodes} columns={columns} size="large" pagination={{ total: masternodes?.length, pageSize: 10 }} />
      </div>
    </div>
  </>
}
