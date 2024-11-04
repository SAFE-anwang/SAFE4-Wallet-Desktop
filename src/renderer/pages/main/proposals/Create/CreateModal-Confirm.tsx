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
import { useTranslation } from "react-i18next"

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
    payType: PayType,
    payAmount?: string,
    payTimes?: number,
    startPayTime?: number,
    endPayTime?: number
  }
}) => {
  const { t } = useTranslation();
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

  const doCreateProposal = useCallback(() => {
    const { title, payAmount, startPayTime, endPayTime, description, payType, payTimes } = createParams;
    if (activeAccount && proposalContract && payAmount) {
      setSending(true);
      // function create(string memory _title, uint _payAmount, uint _payTimes, uint _startPayTime, uint _endPayTime, string memory _description) external payable returns (uint);
      const _payTimes = payType == PayType.ONETIME ? 1 : payTimes;
      const value = ethers.utils.parseEther("1").toBigInt()
      const _startPayTime = startPayTime && Math.floor(startPayTime / 1000);
      const _endPayTime = endPayTime && Math.floor(endPayTime / 1000);
      proposalContract.create(title, ethers.utils.parseEther(payAmount).toBigInt(), _payTimes, _startPayTime, _endPayTime, description, {
        value,
      }).then((response: TransactionResponse) => {
        const { hash, data } = response;
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
      }).catch((err: any) => {
        setSending(false);
        setErr(err)
      });
    }
  }, [activeAccount, createParams, proposalContract]);

  return <Modal title={t("wallet_proposals_create")} open={openCreateModal} footer={null} destroyOnClose onCancel={cancel}>
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
        <Text type="secondary">{t("wallet_send_from")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{t("wallet_account_normal")}</Text>
      </Col>
    </Row>
    <br />
    <Row>
      <Col span={24}>
        <Text type="secondary">{t("wallet_send_to")}</Text>
      </Col>
      <Col span={24} style={{ paddingLeft: "5px" }} >
        <Text>{t("wallet_proposals_vote_contract")}</Text>
      </Col>
    </Row>
    <Divider />
    <Card size="small">
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_proposals_title")}</Text>
        </Col>
        <Col span={24}>
          <Text>{createParams.title}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_proposals_description")}</Text>
        </Col>
        <Col span={24}>
          <Text>{createParams.description}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_proposals_payAmount")}</Text>
        </Col>
        <Col span={24}>
          <Text strong>{createParams.payAmount} SAFE</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
      </Row>
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_proposals_paytype")}</Text>
        </Col>
        <Col span={24}>
          {
            createParams.payType == PayType.ONETIME && createParams.endPayTime && <>
              {
                <>
                  <Text>{t("wallet_proposals_pay_at")}</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(createParams.endPayTime)}</Text><br />
                  <Text><Text strong>{t("wallet_proposals_pay_onetime")}</Text> {t("wallet_proposals_pay_send")} </Text><Text strong style={{ marginLeft: "5px" }}>{createParams.payAmount} SAFE</Text>
                </>
              }
            </>
          }
          {
            createParams.payType == PayType.TIMES && createParams.endPayTime && createParams.startPayTime && <>
              {
                <>
                  <Text>{t("wallet_proposals_pay_at")}</Text><Text strong style={{ marginLeft: "5px", marginRight: "5px" }}>{DateTimeFormat(createParams.startPayTime)}</Text>
                  <Text>{t("wallet_proposals_pay_to")}</Text><Text strong style={{ marginLeft: "5px" }}>{DateTimeFormat(createParams.endPayTime)}</Text><br />
                  <Text><Text strong>{t("wallet_proposals_pay_times")}{createParams.payTimes}{t("wallet_proposals_pay_times_count")}</Text> {t("wallet_proposals_pay_total")} </Text><Text strong style={{ marginLeft: "5px" }}>{createParams.payAmount} SAFE</Text>
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
            {t("wallet_send_status_broadcast")}
          </Button>
        }
        {
          sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_sending")}
          </Button>
        }
        {
          render && <Button onClick={cancel} type="primary" style={{ float: "right" }}>
            {t("wallet_send_status_close")}
          </Button>
        }
      </Col>
    </Row>

  </Modal>
}
