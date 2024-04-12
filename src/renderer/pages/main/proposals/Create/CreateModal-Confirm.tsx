import { LockOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd"
import { useCallback, useState } from "react"
import useTransactionResponseRender from "../../../components/useTransactionResponseRender"
import { useTransactionAdder } from "../../../../state/transactions/hooks"
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks"
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { useNavigate } from "react-router-dom";
import { PayType } from "./ProposalCreate";
import { DateTimeFormat } from "../../../../utils/DateUtils";
import { useProposalContract } from "../../../../hooks/useContracts";
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";

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
    payType : PayType,
    payAmount ?: string,
    payTimes ?: number,
    startPayTime ?: number,
    endPayTime ?: number
  }
}) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const proposalContract = useProposalContract(true);
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
      return;
    }
    setErr(undefined)
  }, [txHash]);

  const doCreateProposal = useCallback( () => {
    const { title , payAmount , startPayTime , endPayTime , description , payType , payTimes } = createParams;
    if ( activeAccount && proposalContract && payAmount ){
      setSending(true);
      // function create(string memory _title, uint _payAmount, uint _payTimes, uint _startPayTime, uint _endPayTime, string memory _description) external payable returns (uint);
      const _payTimes = payType == PayType.ONETIME ? 1 : payTimes;
      const value = ethers.utils.parseEther("1").toBigInt()
      const _startPayTime = startPayTime && Math.floor(startPayTime / 1000);
      const _endPayTime = endPayTime && Math.floor(endPayTime / 1000);
      proposalContract.create( title , ethers.utils.parseEther(payAmount).toBigInt() , _payTimes , _startPayTime , _endPayTime , description , {
        value,
      }).then( (response:TransactionResponse) => {
        const { hash,data } = response;
        addTransaction({ to: proposalContract.address }, response, {
          call: {
            from: activeAccount,
            to: proposalContract.address,
            input: data,
            value: value.toString()
          }
        });
        setTxHash(hash);
        setSending(false);
        setTransactionResponse(response);
      }).catch( (err:any) => {
        setSending(false);
        setErr(err)
      });
    }
  } , [ activeAccount , createParams , proposalContract] );

  return <Modal title="创建提案" open={openCreateModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        <Text strong style={{ fontSize: "32px", marginLeft: "5px" }}>1 SAFE</Text>
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
        <Text>提案合约</Text>
      </Col>
    </Row>
    <Divider />
    <Card size="small">
      <Row>
        <Col span={24}>
          <Text type="secondary">提案标题</Text>
        </Col>
        <Col span={24}>
          <Text>{createParams.title}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">提案简介</Text>
        </Col>
        <Col span={24}>
          <Text>{createParams.description}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">申请SAFE数量</Text>
        </Col>
        <Col span={24}>
          <Text strong>{createParams.payAmount} SAFE</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">发放方式</Text>
        </Col>
        <Col span={24}>
          {
            createParams.payType == PayType.ONETIME && createParams.endPayTime && <>
              {
                <>
                  <Text>在</Text><Text strong style={{marginLeft:"5px"}}>{DateTimeFormat(createParams.endPayTime)}</Text><br />
                  <Text><Text strong>一次性</Text> 发放 </Text><Text strong style={{marginLeft:"5px"}}>{createParams.payAmount} SAFE</Text>
                </>
              }
            </>
          }
           {
            createParams.payType == PayType.TIMES && createParams.endPayTime && createParams.startPayTime  && <>
              {
                <>
                  <Text>在</Text><Text strong style={{marginLeft:"5px",marginRight:"5px"}}>{DateTimeFormat(createParams.startPayTime)}</Text>
                  <Text>到</Text><Text strong style={{marginLeft:"5px"}}>{DateTimeFormat(createParams.endPayTime)}</Text><br/>
                  <Text><Text strong>分期{createParams.payTimes}次</Text> 合计发放 </Text><Text strong style={{marginLeft:"5px"}}>{createParams.payAmount} SAFE</Text>
                </>
              }
            </>
          }
        </Col>
      </Row>
    </Card>
    <Divider />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        {
          !sending && !render && <Button onClick={() => {
            doCreateProposal();
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
