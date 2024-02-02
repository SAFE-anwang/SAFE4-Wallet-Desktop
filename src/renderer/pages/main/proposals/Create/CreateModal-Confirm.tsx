import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react"
import useTransactionResponseRender from "../../../components/useTransactionResponseRender"
import { useTransactionAdder } from "../../../../state/transactions/hooks"
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks"
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { useNavigate } from "react-router-dom";


const { Text } = Typography;

export default ({
  openCreateModal, setOpenCreateModal,
  createParams
}: {
  openCreateModal: boolean,
  setOpenCreateModal: (openCreateModal: boolean) => void,
  createParams: {
    title?: string,
    description?: string,
  }
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sending, setSending] = useState<boolean>(false);
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();
  const activeAccount = useWalletsActiveAccount();

  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenCreateModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  return <Modal title="创建主节点" open={openCreateModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <Text type="secondary">从</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>普通账户</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">到</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>提案合约</Text>
      </Col>
    </Row>
    <Divider />
    <Card size="small">

    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button icon={<LockOutlined />} onClick={() => {
            // doRegisterMasternode();
          }} disabled={sending} type="primary" style={{ float: "right" }}>
            发送交易
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            发送中....
          </Button>
        }
        {
          render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
            关闭
          </Button>
        }
      </Col>
    </Row>

  </Modal>
}
