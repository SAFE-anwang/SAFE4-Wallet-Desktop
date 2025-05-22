import { NumberOutlined } from "@ant-design/icons"
import { Alert, Badge, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useState } from "react";
import { useTranslation } from "react-i18next";
import VersionModal from "./VersionModal";
import { useApplicationPlatform, useApplicationWalletUpdate } from "../../../../state/application/hooks";

const { Title, Text, Link } = Typography;

export default () => {
  const { t } = useTranslation();
  const [openVersionModal, setOpenVersionModal] = useState(false);
  const platform = useApplicationPlatform();
  const walletUpdate = useApplicationWalletUpdate();
  const isLatestWalletVersion = walletUpdate.latestWallet ? walletUpdate.latestWallet.version == walletUpdate.currentVersion : true;

  return <>
    <Row className='menu-item' onClick={() => {
      if (!isLatestWalletVersion) {
        setOpenVersionModal(true);
      }
    }}>
      <Col span={2} style={{ textAlign: "center" }}>
        {
          !isLatestWalletVersion && <Badge dot style={{ width: "8px", height: "8px" }}>
            <NumberOutlined />
          </Badge>
        }
        {
          isLatestWalletVersion && <NumberOutlined />
        }
      </Col>
      <Col span={20}>
        <Text strong>{t("version")} {walletUpdate.currentVersion}</Text>
        <Text type="secondary">({platform})</Text>
        {
          !isLatestWalletVersion && <Text type='secondary'><Divider type='vertical' />有新的版本可以更新</Text>
        }
      </Col>
    </Row>
    <VersionModal openVersionModal={openVersionModal} setOpenVersionModal={setOpenVersionModal} />
  </>
}
