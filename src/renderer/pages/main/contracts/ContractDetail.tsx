
import { LeftOutlined } from '@ant-design/icons';
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Table, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractFunction from './ContractFunction';
import ContractCall from './ContractCall';
import { useSelector } from 'react-redux';
import { AppState } from '../../../state';
import { ContractCompileVO, ContractVO } from '../../../services';
import { fetchContractCompile } from '../../../services/contracts';
import config, { Safe4_Business_Config } from '../../../config';


const { Title, Text } = Typography;


export default () => {

  const navigate = useNavigate();
  const contractVO = useSelector<AppState, ContractVO | undefined>(state => state.application.control.contractVO);
  const [contractCompileVO, setContractCompileVO] = useState<ContractCompileVO>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (contractVO) {
      // 存在 name 则说明这个合约已经验证了;
      if (contractVO.name) {
        const { address, name } = contractVO;
        setLoading(true);
        fetchContractCompile({ address }).then(data => {
          setContractCompileVO(data);
          setLoading(false);
          console.log("contract compile vo>> ", data);
        });
      } else {

      }
    }
  }, [contractVO]);

  const items: TabsProps['items'] = useMemo(() => {
    return [
      {
        key: 'abi',
        label: 'ABI',
        children: <>{contractCompileVO?.abi}</>,
      },
      {
        key: 'contractCall',
        label: '调用合约',
        disabled: !(contractCompileVO && contractCompileVO.abi),
        children: contractCompileVO && contractCompileVO.abi ? <ContractCall address={contractCompileVO.address} abi={contractCompileVO.abi} /> : <></>,
      }
    ];
  }, [contractCompileVO]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/contracts")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          智能合约
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Col span={24} style={{ marginBottom: "20px" }}>
            {
              contractCompileVO?.abi && <>
                <Alert showIcon type='info' message={<>
                  <Row>
                    <Col span={24}>
                      <Text style={{ float: "left" }}>合约已通过源码验证,可在浏览器上查看合约源码了解合约执行内容.</Text>
                      <Button size='small' style={{ float: "right" }} onClick={() => {
                        window.open(`${config.Safescan_URL}/address/${contractVO?.address}`)
                      }} >
                        <Text type='success'>查看源码</Text>
                      </Button>
                    </Col>
                  </Row>
                </>} />
              </>
            }
            {
              !contractCompileVO?.abi && <>
                <Alert showIcon type='warning' message={<>
                  <Row>
                    <Col span={24}>
                      <Text style={{ float: "left" }}>合约未验证,通过浏览器验证合约后,所有用户都可加载合约ABI调用该合约</Text>
                      <Button size='small' style={{ float: "right" }} onClick={() => {
                        window.open(`${config.Safescan_URL}/verifyContract?a=${contractVO?.address}`)
                      }}>
                        <Text type='warning'>验证合约</Text>
                      </Button>
                    </Col>
                  </Row>
                </>} />
              </>
            }
          </Col>

          <Col span={12}>
            <Row>
              <Col span={24}>
                <Text type='secondary'>合约地址</Text>
              </Col>
              <Col span={24}>
                <Text strong>{contractVO?.address}</Text>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <Row>
              <Col span={24}>
                <Text type='secondary'>合约名称</Text>
              </Col>
              <Col span={24}>
                <Text strong>{contractVO?.name}</Text>
              </Col>
            </Row>
          </Col>
        </Row>
        <Divider />
        <Spin spinning={loading}>
          <Card>
            <Tabs defaultActiveKey="abi" items={items} />
          </Card>
        </Spin>
      </div>
    </div>

  </>

}
