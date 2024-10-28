import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, MenuProps, Dropdown } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from "react-redux"
import {
  DatabaseOutlined, DownOutlined, GlobalOutlined, NumberOutlined, RightOutlined, WalletOutlined, WifiOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { applicationUpdateLanguage } from '../../../../state/application/action';
import { electron } from 'process';
import { IPC_CHANNEL } from '../../../../config';
import { AppProp_Methods, AppPropSignal } from '../../../../../main/handlers/AppPropSignalHandler';

const { Title, Text , Link } = Typography;

export default () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const doUpdateAppLanguage = ( language : string ) => {
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [ AppPropSignal , AppProp_Methods.saveOrUpdateAppProp, ["language", language]]);
    dispatch( applicationUpdateLanguage(language) )
  }

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link style={{lineHeight:"40px"}} onClick={() => {
          doUpdateAppLanguage("zh")
        }}>中文</Link>
      ),
    },
    {
      key: '2',
      label: (
        <Link style={{lineHeight:"40px"}}  onClick={() => {
          doUpdateAppLanguage("en")
        }}>English</Link>
      )
    },
  ];

  return <>

    <Dropdown menu={{ items }}>
      <Row className='menu-item'>
        <Col span={2} style={{ textAlign: "center" }}>
          <GlobalOutlined />
        </Col>
        <Col span={20}>
          {t("language")}
        </Col>
        <Col span={2} style={{ textAlign: "center" }}>
          <DownOutlined />
        </Col>
      </Row>
    </Dropdown>

  </>


}
