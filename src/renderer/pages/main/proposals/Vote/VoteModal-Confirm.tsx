import { useDispatch } from "react-redux";
import { ProposalInfo } from "../../../../structs/Proposal"
import { useNavigate } from "react-router-dom";
import { useProposalContract } from "../../../../hooks/useContracts";
import { useCallback, useState } from "react";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import { TransactionResponse } from "@ethersproject/providers";
import { Button, Card, Col, Divider, Modal, Row, Typography } from "antd";
import { DateTimeFormat } from "../../../../utils/DateUtils";
import { RenderVoteResult } from "./ProposalVoteInfos";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

const { Text } = Typography;

export default ({
  openVoteModal, setOpenVoteModal,
  proposalInfo, voteResult
}: {
  openVoteModal: boolean,
  setOpenVoteModal: (openVoteModal: boolean) => void,
  proposalInfo: ProposalInfo,
  voteResult: number
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
  const { provider, chainId } = useWeb3React();
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenVoteModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
      return;
    }
    setErr(undefined);
  }, [txHash]);

  const doVoteProposal = useCallback(async () => {
    if (activeAccount && proposalContract && chainId && provider) {
      setSending(true);
      // function vote(uint _id, uint _voteResult) external;
      const data = proposalContract.interface.encodeFunctionData("vote", [
        proposalInfo.id, voteResult
      ]);
      const tx: ethers.providers.TransactionRequest = {
        to: proposalContract.address,
        data,
        chainId
      };
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        provider.connection.url,
        tx
      );
      if (signedTx) {
        try {
          const response = await provider.sendTransaction(signedTx);
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: proposalContract.address }, response, {
            call: {
              from: activeAccount,
              to: proposalContract.address,
              input: data,
              value: "0"
            }
          });
          setTxHash(hash);
        } catch (err) {
          setErr(err)
        } finally {
          setSending(false);
        }
      }
      if (error) {
        setSending(false);
        setErr(error)
      }


    }
  }, [activeAccount, proposalInfo, voteResult, proposalContract]);

  return <Modal title="提案投票" open={openVoteModal} footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    {
      render
    }
    <Row>
      <Col span={24}>
        {RenderVoteResult(voteResult)}
      </Col>
    </Row>
    <Divider />
    <Card size="small">
      <Row>
        <Col span={24}>
          <Text type="secondary">提案标题</Text>
        </Col>
        <Col span={24}>
          <Text>{proposalInfo.title}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">提案简介</Text>
        </Col>
        <Col span={24}>
          <Text>{proposalInfo.description}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">申请SAFE数量</Text>
        </Col>
        <Col span={24}>
          <Text strong>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">发放方式</Text>
        </Col>
        <Col span={24}>
          {
            proposalInfo.payTimes == 1 && <>
              {
                <>
                  <Text>在</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                  <Text><Text strong>一次性</Text> 发放 </Text><Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
                </>
              }
            </>
          }
          {
            proposalInfo.payTimes > 1 && <>
              {
                <>
                  <Text>在</Text><Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>{DateTimeFormat(proposalInfo.startPayTime * 1000)}</Text>
                  <Text>到</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(proposalInfo.endPayTime * 1000)}</Text><br />
                  <Text><Text strong>分期{proposalInfo.payTimes}次</Text> 合计发放 </Text><Text strong style={{ marginLeft: "5px" }}>{proposalInfo.payAmount.toFixed(6)} SAFE</Text>
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
            doVoteProposal();
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
