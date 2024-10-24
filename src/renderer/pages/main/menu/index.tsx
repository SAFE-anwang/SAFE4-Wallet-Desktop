import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux"
import { AppState } from "../../../state";
import {
  DatabaseOutlined, RightOutlined, WalletOutlined, WifiOutlined
} from '@ant-design/icons';
import "./index.css"
import { useApplicationPassword } from '../../../state/application/hooks';
import { useTranslation } from 'react-i18next';
import { applicationUpdateLanguage } from '../../../state/application/action';

const { Title, Text } = Typography;


export default () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(applicationUpdateLanguage("en"))
  }, [dispatch])

  return (<>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("menu")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card className="menu-item-container" style={{ marginBottom: "20px" }}>

          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            // navigate("/main/menu/storage")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <DatabaseOutlined />
            </Col>
            <Col span={20}>
              版本 v2.0.0
            </Col>
            {/* <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col> */}
          </Row>
          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/network")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <WifiOutlined />
            </Col>
            <Col span={20}>
              网络
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>

          <Divider style={{ margin: "0px 0px" }} />
          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/storage")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <DatabaseOutlined />
            </Col>
            <Col span={20}>
              存储
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>
        </Card>
        <Card className="menu-item-container" style={{ marginBottom: "20px" }}>
          <Row className='menu-item' onClick={() => {
            navigate("/main/menu/modifyPassword")
          }}>
            <Col span={2} style={{ textAlign: "center" }}>
              <WalletOutlined />
            </Col>
            <Col span={20}>
              修改钱包密码
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <RightOutlined />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  </>)
}
