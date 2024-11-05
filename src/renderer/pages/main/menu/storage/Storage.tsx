import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux"
import {
  LeftOutlined
} from '@ant-design/icons';
import { AppState } from '../../../../state';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const data = useSelector<AppState, { [key: string]: any }>(state => state.application.data);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/menu")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          存储
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "60%" }}>
        <Card style={{ marginBottom: "20px" }}>

          <Row>
            <Col span={24}>
              <Text type='secondary'>{t("wallet_storage_localdb")}</Text>
            </Col>
            <Col span={24}>
              <Text>{data["database"]}</Text>
            </Col>
          </Row>

          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type='secondary'>{t("wallet_storage_walletfile")}</Text>
            </Col>
            <Col span={24}>
              <Text>{data["kys"]}</Text>
            </Col>
          </Row>

        </Card>
      </div>
    </div>
  </>
}
