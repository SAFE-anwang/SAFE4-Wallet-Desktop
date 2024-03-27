import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux"
import {
  LeftOutlined
} from '@ant-design/icons';
import { useWeb3Hooks } from '../../../../connectors/hooks';

const { Title, Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const { useProvider } = useWeb3Hooks();
  const provider = useProvider();

  useEffect( () => {
    if ( provider ){
      console.log(provider)
      provider.getNetwork().then( ( data ) => {
        console.log( data )
      } )
    }
  } , [] );

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/menu")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          网络
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card style={{ marginBottom: "20px" }}>
          network
        </Card>
      </div>
    </div>

  </>
}
