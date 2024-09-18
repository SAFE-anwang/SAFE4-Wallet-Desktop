import { useCallback, useEffect, useRef, useState } from "react"
import { IPC_CHANNEL } from "../../../config";
import { Alert, Button, Card, Col, Divider, Flex, Modal, Progress, Row, Space, Statistic, Steps, Table, TableProps, Tag, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { useNavigate } from "react-router-dom";
import { ApiOutlined, DatabaseOutlined, RightOutlined, WifiOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { AppState } from "../../../state";
import { formatMasternode, MasternodeInfo } from "../../../structs/Masternode";
import { useMasternodeStorageContract } from "../../../hooks/useContracts";

const { Text, Title } = Typography

export default () => {

  const editMasternodeId = useSelector((state: AppState) => state.application.control.editMasternodeId);
  const [masternodeInfo, setMasternodeInfo] = useState<MasternodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();

  useEffect(() => {
    if (editMasternodeId && masternodeStorageContract) {
      masternodeStorageContract.callStatic.getInfoByID(editMasternodeId).then(_masternodeInfo => {
        setMasternodeInfo(formatMasternode(_masternodeInfo));
      });
    }
  }, [editMasternodeId, masternodeStorageContract]);

  return <>
    {JSON.stringify(masternodeInfo)}
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑主节点
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>

          <Row style={{ marginTop: "20px", marginBottom: "20px" }}>
            <Col span={24}>
              <Alert type='info' showIcon message={
                <>
                  <Row>
                    <Col span={24}>
                      <Text>
                        已有服务器,也可以选择通过 SSH 登陆来辅助更新主节点.
                      </Text>
                      <Button type='primary' size='small' style={{ float: "right" }}>辅助更新</Button>
                    </Col>
                  </Row>
                </>
              }></Alert>
            </Col>
          </Row>

          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type="secondary">主节点ID</Text>
            </Col>
            <Col>
              <Text>{masternodeInfo?.id}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">主节点创建者</Text>
            </Col>
            <Col>
              <Text>{masternodeInfo?.creator}</Text>
            </Col>

          </Row>

        </div>

      </Card>
    </Row>



  </>

}

