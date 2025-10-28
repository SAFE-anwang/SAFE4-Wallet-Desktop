
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal, Tabs, TabsProps, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import SupernodeList from './SupernodeList';
import useAddrNodeInfo from '../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';
import { useMulticallContract, useSupernodeStorageContract } from '../../../hooks/useContracts';
import { useBlockNumber, useSNAddresses } from '../../../state/application/hooks';
import { useWeb3React } from '@web3-react/core';
import { useDispatch } from 'react-redux';
import { applicationLoadSSHConfigs, applicationUpdateSNAddresses } from '../../../state/application/action';
import { IPC_CHANNEL } from '../../../config';
import { SSHConfig_Methods, SSHConfigSignal } from '../../../../main/handlers/SSHConfigSignalHandler';
import { SSH2ConnectConfig } from '../../../../main/SSH2Ipc';

const { Title, Text } = Typography;

export const RenderNodeState = (state: number, t?: any) => {
  switch (state) {
    case 0:
      return <Badge status="success" text={t ? t("wallet_supernodes_state_init") : "初始化"} />
    case 1:
      return <Badge status="processing" text={t ? t("wallet_supernodes_state_online") : "在线"} />
    case 2:
      return <Badge status="error" text={<Text type='danger'>{t ? t("wallet_supernodes_state_error") : "异常"}</Text>} />
    default:
      return <Badge status="default" text={t ? t("wallet_supernodes_state_known") : "未知"} />
  }
}

export function toFixedNoRound(number: number, decimalPlaces: number) {
  const str = number.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) {
    return str;
  }
  const truncatedStr = str.substring(0, decimalIndex + decimalPlaces + 1);
  return parseFloat(truncatedStr).toFixed(decimalPlaces);
}

export default () => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);
  const [activeItemKey, setActiveItemKey] = useState("myVotedSupernodes");
  const blockNumber = useBlockNumber();
  const { chainId } = useWeb3React();
  const dispatch = useDispatch();
  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'list',
        label: t("wallet_supernodes_list"),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={false} queryVotedSupernodes={false} />,
      },
      {
        key: 'mySupernodes',
        label: t("wallet_supernodes_mine"),
        children: <SupernodeList queryMySupernodes={true} queryJoinSupernodes={false} queryVotedSupernodes={false} />,
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
      },
      {
        key: 'myJoinedSupernodes',
        label: t("wallet_supernodes_join"),
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={true} queryVotedSupernodes={false} />,
      },
      {
        key: 'myVotedSupernodes',
        label: t("wallet_supernodes_myvoted"),
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={false} queryVotedSupernodes={true} />,
      },
    ]
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect(() => {
    if (activeAccountNodeInfo && activeAccountNodeInfo.isNode) {
      setActiveItemKey("list");
    }
  }, [activeAccount, activeAccountNodeInfo]);

  const supernodeStorageContract = useSupernodeStorageContract();
  useEffect(() => {
    if (supernodeStorageContract && chainId) {
      const fetchSNAddresses = async () => {
        const num = await supernodeStorageContract.callStatic.getNum();
        const querySize = 100;
        const queryTimes = Math.ceil(num / querySize);
        const snAddresses: string[] = [];
        for (let i = 0; i < queryTimes; i++) {
          const _addresses = await supernodeStorageContract.callStatic.getAll(
            querySize * i, querySize
          );
          snAddresses.push(..._addresses);
        }
        dispatch(applicationUpdateSNAddresses({
          chainId, addresses: snAddresses
        }))
      }
      fetchSNAddresses();
    }
  }, [supernodeStorageContract, blockNumber, chainId]);

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
          {t("supernode")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Alert showIcon type='info' message={<>
            <Text>{t("wallet_supernodes_tip0")}</Text><br />
            <Text>{t("wallet_supernodes_tip1")}</Text><br />
          </>} />
          <Divider />
          <>
            <Spin spinning={activeAccountNodeInfo == undefined}>
              <Button disabled={activeAccountNodeInfo == undefined || activeAccountNodeInfo?.isNode}
                style={{ marginBottom: "5px" }} onClick={() => { navigate("/main/supernodes/selectRegisterMode") }}>
                {t("wallet_supernodes_create")}
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
        <br /><br />
        <Card>
          <Tabs activeKey={activeItemKey} items={items} onChange={setActiveItemKey}></Tabs>
        </Card>
      </div>
    </div>
  </>
}
