import { useCallback, useEffect, useState } from "react";
import { useDAppManagerContract, useMulticallContract } from "../../../hooks/useContracts"
import { DAppInfo, formatDAppInfo } from "../../../structs/DApp";
import { Avatar, Button, Col, Divider, List, Modal, Row, Space, Table, Tooltip, Typography } from "antd";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import DAppEdit from "./DAppEdit";
import DAppSetLogo from "./DAppSetLogo";
import DAppInfoDetail from "./DAppInfoDetail";
import DAppRemove from "./DAppRemove";
import { useDAppList } from "../../../state/dApp/hooks";
import { DAppInfoWithLogo } from "../../../state/dApp/reducer";
import { useBlockNumber } from "../../../state/application/hooks";

const { Text, Link } = Typography;

// 定义操作类型
type DAppAction = "detail" | "edit" | "logo" | "remove";

// 每种操作的标题
const ACTION_TITLES: Record<DAppAction, string> = {
  detail: "应用详情",
  edit: "编辑信息",
  logo: "设置LOGO",
  remove: "删除应用",
};

export default ({
  queryMyDAppList
}: {
  queryMyDAppList?: boolean
}) => {

  // ---- 新增：Modal 控制状态 ----
  const [action, setAction] = useState<DAppAction | null>(null);
  const [currentDApp, setCurrentDApp] = useState<DAppInfo | null>(null);

  const openModal = (action: DAppAction, dAppInfo: DAppInfo) => {
    setCurrentDApp(dAppInfo);
    setAction(action);
  };

  const closeModal = () => {
    setAction(null);
    setCurrentDApp(null);
  };

  // 根据 action 渲染对应的组件
  const renderModalContent = () => {
    if (!currentDApp || !action) return null;
    switch (action) {
      case "detail":
        return <DAppInfoDetail dAppInfo={currentDApp} onClose={closeModal} />;
      case "edit":
        return <DAppEdit dAppInfo={currentDApp} onClose={closeModal} />;
      case "logo":
        return <DAppSetLogo dAppInfo={currentDApp} onClose={closeModal} />;
      case "remove":
        return <DAppRemove dAppInfo={currentDApp} onClose={closeModal} />;
      default:
        return null;
    }
  };
  const { list, loading, total } = useDAppList(queryMyDAppList ? "mine" : "all");
  const isFirstLoading = loading && list.length === 0;
  const isRefreshing = loading && list.length > 0;
  const isEmpty = !loading && list.length === 0;

  return <>
    <List
      size="large"
      loading={isFirstLoading}
      dataSource={list}
      rowKey={(dAppInfo) => dAppInfo.id}
      renderItem={(dAppInfoWithLogo: DAppInfoWithLogo, index) => {
        const dAppInfo = dAppInfoWithLogo.dAppInfo;
        return <>
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={dAppInfoWithLogo.logo} style={{ marginTop: "5px" }} />}
              title={<>
                <Row>
                  <Col span={24}>
                    <Tooltip title={dAppInfo.runUrl}>
                      <Link onClick={() => {
                        window.electron.dapp.openView(dAppInfo.runUrl);
                      }}>{dAppInfo.name}</Link>
                    </Tooltip>
                    <Divider type="vertical" />
                    <Text type="secondary">{dAppInfo.keyword}</Text>
                  </Col>
                </Row>
              </>}
              description={dAppInfo.description}
            />
            <div>
              <Space style={{ float: "right" }}>
                <Button onClick={() => openModal("detail", dAppInfo)}>应用详情</Button>
                {
                  queryMyDAppList && <>
                    <Button type="primary" onClick={() => openModal("edit", dAppInfo)}>编辑信息</Button>
                    <Button type="primary" onClick={() => openModal("logo", dAppInfo)}>设置LOGO</Button>
                    <Button color="danger" variant="solid" onClick={() => openModal("remove", dAppInfo)}>删除应用</Button>
                  </>
                }
              </Space>
            </div>
          </List.Item>
        </>
      }}
    />

    {/* 统一用一个 Modal 承载四种操作 */}
    <Modal
      open={!!action}
      title={action ? ACTION_TITLES[action] : ""}
      footer={null}
      destroyOnHidden
      onCancel={closeModal}
      width={800}
    >
      {renderModalContent()}
    </Modal>
  </>
}
