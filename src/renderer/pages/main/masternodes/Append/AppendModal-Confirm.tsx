import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useMasternodeLogicContract, useSupernodeLogicContract } from "../../../../hooks/useContracts";
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import AddressView from "../../../components/AddressView";
import { MasternodeInfo } from "../../../../structs/Masternode";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";

const { Text } = Typography;

export default ({
  openAppendModal, setOpenAppendModal,
  masternodeInfo,
  valueAmount
}: {
  openAppendModal: boolean,
  setOpenAppendModal: (openCreateModal: boolean) => void,
  masternodeInfo: MasternodeInfo,
  valueAmount: number
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
  const masternodeLogicContract = useMasternodeLogicContract(true);

  const doAppendMasternode = useCallback(() => {
    if (activeAccount && masternodeLogicContract) {
      setSending(true);
      /**
       *  function appendRegister(address _addr, uint _lockDay) external payable;
       */
      const value = ethers.utils.parseEther(valueAmount + "");
      masternodeLogicContract.appendRegister(
        masternodeInfo.addr,
        360,
        {
          value: value,
        }
      ).then((response: TransactionResponse) => {
        const { hash , data } = response;
        addTransaction({ to: masternodeLogicContract.address }, response, {
          call: {
            from: activeAccount,
            to: masternodeLogicContract.address,
            input: data,
            value: value.toString()
          }
        });
        setTxHash(hash);
        setTransactionResponse(response);
        setSending(false);
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      });

    }
  }, [activeAccount, masternodeLogicContract, valueAmount]);

  const [txHash,setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenAppendModal(false);
    if (txHash){
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash] );

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
          <Text type="secondary">主节点地址</Text>
        </Col>
        <Col span={24}>
          <Text><AddressView address={masternodeInfo.addr} /></Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">主节点简介</Text>
        </Col>
        <Col span={24}>
          <Text>{masternodeInfo.description}</Text>
        </Col>
      </Row>
    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button onClick={() => {
            doAppendMasternode();
          }} disabled={sending} type="primary" style={{ float: "right" }}>
            广播交易
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
