
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import MasternodeList from './MasternodeList';
import useAddrNodeInfo from '../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';
import { IPC_CHANNEL } from '../../../config';
import { SSHConfig_Methods, SSHConfigSignal } from '../../../../main/handlers/SSHConfigSignalHandler';
import { SSH2ConnectConfig } from '../../../../main/SSH2Ipc';
import { useDispatch } from 'react-redux';
import { applicationLoadSSHConfigs } from '../../../state/application/action';
import { useSSHConfigMap } from '../../../state/application/hooks';
const { Title, Text } = Typography;

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);
  const [activeItemKey, setActiveItemKey] = useState("list");
  const dispatch = useDispatch();

  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'list',
        label: t("wallet_masternodes_list"),
        children: <MasternodeList queryMyMasternodes={false} queryJoinMasternodes={false} />,
      },
      {
        key: 'myMasternodes',
        label: t("wallet_masternodes_mine"),
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <MasternodeList queryMyMasternodes={true} queryJoinMasternodes={false} />,
      },
      {
        key: 'myJoinMasternodes',
        label: t("wallet_masternodes_join"),
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <MasternodeList queryMyMasternodes={false} queryJoinMasternodes={true} />,
      },
    ]
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect(() => {
    if (activeAccountNodeInfo && activeAccountNodeInfo.isNode) {
      setActiveItemKey("list");
    }
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [SSHConfigSignal, SSHConfig_Methods.getAll, []])
    window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
      if (arg instanceof Array && arg[0] == SSHConfigSignal && arg[1] == SSHConfig_Methods.getAll) {
        const rows = arg[2][0];
        const _hostSSHConfigMap: {
          [host: string]: SSH2ConnectConfig;
        } = {};
        Object.values(rows).forEach((row: any) => {
          const { host, port, username, password } = row;
          _hostSSHConfigMap[host] = {
            host, port, username, password
          }
        });
        dispatch(applicationLoadSSHConfigs(Object.values(_hostSSHConfigMap)));
      }
    });
  }, []);


  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("masternode")}
        </Title>
      </Col>

    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert showIcon type="info" message={<>
            <Row>
              <Col span={24}>
                <Text>{t("wallet_masternodes_tip0")}</Text>
              </Col>
              <Col span={24}>
                <Text>{t("wallet_masternodes_tip1")}</Text>
              </Col>
            </Row>
          </>} />
          <Divider />
          <>
            <Spin spinning={activeAccountNodeInfo == undefined}>
              <Button disabled={activeAccountNodeInfo == undefined || activeAccountNodeInfo?.isNode}
                style={{ marginBottom: "5px" }} onClick={() => { navigate("/main/masternodes/selectRegisterMode") }}>
                {t("wallet_masternodes_create")}
              </Button>
              {
                activeAccountNodeInfo?.isMN && <>
                  <Alert showIcon type='warning' message={<>
                    已经是主节点
                  </>} />
                </>
              }
              {
                activeAccountNodeInfo?.isSN && <>
                  <Alert showIcon type='warning' message={<>
                    已经是超级节点
                  </>} />
                </>
              }
            </Spin>
          </>
        </Card>
        <Card>
          <Tabs activeKey={activeItemKey} items={items} onChange={setActiveItemKey}></Tabs>
        </Card>
      </div>
    </div>
  </>
}
