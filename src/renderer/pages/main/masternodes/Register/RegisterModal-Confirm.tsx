import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react"
import useTransactionResponseRender from "../../../components/useTransactionResponseRender"
import { useTransactionAdder } from "../../../../state/transactions/hooks"
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks"
import { useMasternodeLogicContract } from "../../../../hooks/useContracts"
import { Masternode_Create_Type_NoUnion, Masternode_create_type_Union } from "./MasternodeRegister";
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { Safe4_Business_Config } from "../../../../config";

const { Text } = Typography;

export default ({
  openRegisterModal, setOpenRegisterModal, registerParams
}: {
  openRegisterModal: boolean,
  setOpenRegisterModal: (openRegisterModal: boolean) => void,
  registerParams: {
    registerType: number,
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined,
    incentivePlan: {
      creator: number,
      partner: number
    }
  }
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerType } = registerParams;
  const [sending, setSending] = useState<boolean>(false);
  const {
    render,
    setTransactionResponse,
    setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();
  const activeAccount = useWalletsActiveAccount();
  const masternodeLogicContract = useMasternodeLogicContract(true);

  const doRegisterMasternode = useCallback(() => {
    if (activeAccount && masternodeLogicContract) {
      const { registerType, enode, description, incentivePlan, address } = registerParams;
      // function register(bool _isUnion, address _addr, uint _lockDay, string memory _enode, string memory _description,
      //  uint _creatorIncentive, uint _partnerIncentive) external payable;
      //
      const value = ethers.utils.parseEther(
        Masternode_create_type_Union == registerType ? Safe4_Business_Config.Masternode.Create.UnionLockAmount + ""
          : Safe4_Business_Config.Masternode.Create.LockAmount + ""
      );
      if (registerType == Masternode_Create_Type_NoUnion) {
        incentivePlan.creator = 100;
        incentivePlan.partner = 0;
      }
      setSending(true);
      masternodeLogicContract.register(
        Masternode_create_type_Union == registerType,
        address,
        Safe4_Business_Config.Masternode.Create.LockDays,
        enode, description,
        incentivePlan.creator, incentivePlan.partner,
        {
          value,
        }
      ).then((response: TransactionResponse) => {
        const { hash, data } = response;
        addTransaction({ to: masternodeLogicContract.address }, response, {
          call: {
            from: activeAccount,
            to: masternodeLogicContract.address,
            input: data,
            value: value.toString()
          }
        });
        setTxHash(hash);
        setSending(false);
        setTransactionResponse(response);
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      });
    }
  }, [activeAccount, masternodeLogicContract, registerParams]);

  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenRegisterModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);

  return <Modal title="创建主节点" open={openRegisterModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <LockOutlined style={{ fontSize: "32px" }} />
        {
          registerType == Masternode_Create_Type_NoUnion &&
          <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>1,000 SAFE</Text>
        }
        {
          registerType == Masternode_create_type_Union &&
          <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>200 SAFE</Text>
        }
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
          <Text type="secondary">主节点ENODE</Text>
        </Col>
        <Col span={24}>
          <Text>{registerParams.enode}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">主节点简介</Text>
        </Col>
        <Col span={24}>
          <Text>{registerParams.description}</Text>
        </Col>
      </Row>
    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button onClick={() => {
            doRegisterMasternode();
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
