import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useSupernodeLogicContract } from "../../../../hooks/useContracts";
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import { SupernodeInfo } from "../../../../structs/Supernode";
import AddressView from "../../../components/AddressView";

const { Text } = Typography;

export default ({
  openAppendModal, setOpenAppendModal,
  supernodeInfo,
  valueAmount
}: {
  openAppendModal: boolean,
  setOpenAppendModal: (openCreateModal: boolean) => void,
  supernodeInfo: SupernodeInfo,
  valueAmount: number
}) => {
  const cancel = () => {
    setOpenAppendModal(false);
  }
  const [sending, setSending] = useState<boolean>(false);
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();
  const activeAccount = useWalletsActiveAccount();
  const supernodeLogicContract = useSupernodeLogicContract(true);

  const doAppendSupernode = useCallback(() => {
    if (activeAccount && supernodeLogicContract) {
      setSending(true);
      /**
       *  function appendRegister(address _addr, uint _lockDay) external payable;
       */
      const value = ethers.utils.parseEther(valueAmount+"");
      supernodeLogicContract.appendRegister(
        supernodeInfo.addr,
        360,
        {
          value : value
        }
      ).then((response: TransactionResponse) => {
        setSending(false);
        const { data } = response;
        addTransaction({ to: supernodeLogicContract.address }, response, {
          call: {
            from: activeAccount,
            to: supernodeLogicContract.address,
            input: data,
            value: value.toString()
          }
        });
        setTransactionResponse(response);
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      });

    }
  }, [activeAccount, supernodeLogicContract , valueAmount]);

  return <Modal title="联合创建超级节点" open={openAppendModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <LockOutlined style={{ fontSize: "32px" }} />
        <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>{valueAmount} SAFE</Text>
      </Col>
    </Row>
    <br />
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
        <Text>锁仓账户</Text>
      </Col>
    </Row>
    <Divider />
    <Card size="small">
      <Row>
        <Col span={24}>
          <Text type="secondary">超级节点地址</Text>
        </Col>
        <Col span={24}>
          <Text><AddressView address={supernodeInfo.addr}/></Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">超级节点名称</Text>
        </Col>
        <Col span={24}>
          <Text>{supernodeInfo.name}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">超级节点简介</Text>
        </Col>
        <Col span={24}>
          <Text>{supernodeInfo.description}</Text>
        </Col>
      </Row>
    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button onClick={() => {
            doAppendSupernode();
          }} disabled={sending} type="primary" style={{ float: "right" }}>
            执行
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            发送中....
          </Button>
        }
        {
          render && <Button onClick={close} type="primary" style={{ float: "right" }}>
            关闭
          </Button>
        }
      </Col>
    </Row>

  </Modal>
}
