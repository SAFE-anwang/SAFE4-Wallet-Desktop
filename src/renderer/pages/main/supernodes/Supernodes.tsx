
import { Typography, Row, Col, Progress, Table, Badge, Button, Space, Card, Alert, Divider, Modal, Tabs, TabsProps, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletsActiveAccount } from '../../../state/wallets/hooks';
import SupernodeList from './SupernodeList';
import useAddrNodeInfo from '../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';

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
  const [activeItemKey, setActiveItemKey] = useState("list");

  const items = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'list',
        label: t("wallet_supernodes_list"),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={false} />,
      },
      {
        key: 'mySupernodes',
        label: t("wallet_supernodes_mine"),
        children: <SupernodeList queryMySupernodes={true} queryJoinSupernodes={false} />,
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
      },
      {
        key: 'myJoinedSupernodes',
        label: t("wallet_supernodes_join"),
        disabled: activeAccountNodeInfo == undefined || (activeAccountNodeInfo?.isNode),
        children: <SupernodeList queryMySupernodes={false} queryJoinSupernodes={true} />,
      },
    ]
  }, [activeAccount, activeAccountNodeInfo]);

  useEffect(() => {
    if (activeAccountNodeInfo && activeAccountNodeInfo.isNode) {
      setActiveItemKey("list");
    }
  }, [activeAccount, activeAccountNodeInfo])

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
