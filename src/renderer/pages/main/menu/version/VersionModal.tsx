

import { NumberOutlined } from "@ant-design/icons"
import { Alert, Badge, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { useTranslation } from "react-i18next";
import { useApplicationWalletUpdate } from "../../../../state/application/hooks";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletUpdateIgore } from "../../../../state/application/action";
import { useMemo } from "react";

const { Title, Text, Link } = Typography;


export default ({
  openVersionModal, setOpenVersionModal
}: {
  openVersionModal: boolean,
  setOpenVersionModal: (openVersionModal: boolean) => void
}) => {

  const walletUpdate = useApplicationWalletUpdate();
  const walletTooLow = walletUpdate.latestWallet ? walletUpdate.latestWallet.versionCode - walletUpdate.currentVersionCode > 10 : false;

  const dispatch = useDispatch();
  const updates = useMemo(() => {
    if (walletUpdate.latestWallet) {
      const _updates = JSON.parse(walletUpdate.latestWallet.updates);
      try {
        const arr = JSON.parse(walletUpdate.latestWallet.updates);
        if (typeof arr == 'object') {
          return arr;
        }
      } catch (err) {
        return [];
      }
      return [];
    }
  }, [walletUpdate]);

  const cancel = () => {
    setOpenVersionModal(false);
    dispatch(applicationUpdateWalletUpdateIgore(true));
  }

  return <>
    <Modal title="版本更新" open={openVersionModal} footer={null} destroyOnClose onCancel={cancel}>
      <Divider />
      <Row>
        {
          walletTooLow && <Col span={24} style={{ marginBottom: "20px" }}>
            <Alert type="warning" showIcon message={<>
              您当前使用的版本太低,强烈推荐您安装最新钱包.
            </>} />
          </Col>
        }
        <Col span={24}>
          <Text type="secondary">最新版本</Text><br />
          <Text strong>{walletUpdate.latestWallet?.version}</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          {
            updates && <>
              <Text type="secondary">更新日志</Text>
              <ul style={{ marginTop: "5px" }}>
                {
                  updates.map((tip: string) => {
                    return <li>{tip}</li>
                  })
                }
              </ul>
            </>
          }
        </Col>
        <Col span={24}>
          {
            walletUpdate.latestWallet && <>
              <Text type="secondary">下载链接</Text><br />
              <Link onClick={() => walletUpdate.latestWallet && window.open(walletUpdate.latestWallet.url)}>
                {
                  walletUpdate.latestWallet.url
                }
              </Link>
              <Alert style={{ marginTop: "5px" }} type="info" message={"下载最新钱包后,关闭钱包程序,运行新版本安装文件即可."} />
            </>
          }
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Button onClick={cancel} style={{ float: "right" }}>关闭</Button>
        </Col>
      </Row>
    </Modal>
  </>

}
