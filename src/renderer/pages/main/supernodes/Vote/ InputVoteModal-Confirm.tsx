

import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Checkbox, Card } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { SupernodeInfo } from "../../../../structs/Supernode";
import { AccountRecord } from "../../../../structs/AccountManager";
import AddressView from "../../../components/AddressView";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useSupernodeVoteContract } from "../../../../hooks/useContracts";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { ethers } from "ethers";
import { useTranslation } from "react-i18next";

const { Text, Link } = Typography;

export default ({
  openVoteModal, setOpenVoteModal,
  supernodeInfo,
  amount
}: {
  openVoteModal: boolean,
  setOpenVoteModal: (openVoteModal: boolean) => void,
  supernodeInfo: SupernodeInfo,
  amount: string
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sending, setSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>();
  const cancel = useCallback(() => {
    setOpenVoteModal(false);
    if (txHash) {
      setTxHash(undefined);
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [txHash]);
  const {
    render, setTransactionResponse, setErr
  } = useTransactionResponseRender();
  const addTransaction = useTransactionAdder();
  const supernodeVoteContract = useSupernodeVoteContract(true);
  const activeAccount = useWalletsActiveAccount();
  const doVoteSupernode = useCallback(() => {
    if (supernodeVoteContract) {
      const value = ethers.utils.parseEther(amount);
      setSending(true);
      // function voteOrApprovalWithAmount(bool _isVote, address _dstAddr) external
      supernodeVoteContract.voteOrApprovalWithAmount( true, supernodeInfo.addr, {
        value
      })
        .then((response: any) => {
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: supernodeVoteContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeVoteContract.address,
              input: data,
              value: value.toString()
            }
          });
          setTxHash(hash);
          setSending(false);
        }).catch((err: any) => {
          setErr(err);
          setSending(false);
        })
    }
  }, [supernodeInfo, supernodeVoteContract, activeAccount,amount]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_supernodes_votes")} width="600px" open={openVoteModal} onCancel={cancel}>
      <Divider />
      {
        render
      }
      <Row >
        <Col span={24}>
          <LockOutlined style={{ fontSize: "32px" }} />
          <Text style={{ fontSize: "32px" }} strong>{amount} SAFE</Text>
        </Col>
      </Row>
      <Row >
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
          <Text type="secondary">{t("wallet_send_from")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text>{t("wallet_account_locked")}</Text>
        </Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_supernodes_votes_to")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text strong>{t("supernode")}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
        <Col span={24}>
          <Card size="small" style={{marginTop:"20px"}}>
            <Row>
              <Col span={24}>
                <Text type="secondary">{t("wallet_supernodes_id")}</Text>
              </Col>
              <Col span={24}>
                <Text>{supernodeInfo.id}</Text>
              </Col>
              <Divider style={{ margin: "8px 0px" }} />
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary">{t("wallet_supernodes_address")}</Text>
              </Col>
              <Col span={24}>
                <Text><AddressView address={supernodeInfo.addr} /></Text>
              </Col>
              <Divider style={{ margin: "8px 0px" }} />
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary">{t("wallet_supernodes_name")}</Text>
              </Col>
              <Col span={24}>
                <Text>{supernodeInfo.name}</Text>
              </Col>
              <Divider style={{ margin: "8px 0px" }} />
            </Row>
            <Row>
              <Col span={24}>
                <Text type="secondary">{t("wallet_supernodes_description")}</Text>
              </Col>
              <Col span={24}>
                <Text>{supernodeInfo.description}</Text>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Divider></Divider>
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !render && <Button onClick={() => {
              doVoteSupernode();
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
  </>

}
