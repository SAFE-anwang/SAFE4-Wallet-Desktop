

import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Checkbox, Card } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { SupernodeInfo } from "../../../../structs/Supernode";
import { AccountRecord } from "../../../../structs/AccountManager";
import AddressView from "../../../components/AddressView";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { useSupernodeVoteContract } from "../../../../hooks/useContracts";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { applicationUpdateWalletTab } from "../../../../state/application/action";
import useTransactionResponseRender from "../../../components/useTransactionResponseRender";
import { useTranslation } from "react-i18next";

const { Text, Link } = Typography;

export default ({
  openVoteModal, setOpenVoteModal,
  supernodeInfo,
  accountRecords
}: {
  openVoteModal: boolean,
  setOpenVoteModal: (openVoteModal: boolean) => void,
  supernodeInfo: SupernodeInfo,
  accountRecords: AccountRecord[]
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
  const options = accountRecords.map(accountRecord => {
    return {
      label: <>
        <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
          <Row>
            <Col>{t("wallet_locked_accountRecordLockId")}:</Col>
            <Col>{accountRecord.id}</Col>
          </Row>
          <Row style={{ fontSize: "12px" }}>{accountRecord.amount.toFixed(2)} SAFE</Row>
        </div>
      </>,
      value: accountRecord.id,
      disabled: true
    }
  });
  const accountRecordIds = accountRecords.map(accountRecord => accountRecord.id);
  const totalCheckedAccountRecordAmount = accountRecords.reduce<CurrencyAmount>((totalCheckedAccountRecordAmount, accountRecord) => {
    return totalCheckedAccountRecordAmount.add(accountRecord.amount)
  }, CurrencyAmount.ether(JSBI.BigInt(0)));

  const supernodeVoteContract = useSupernodeVoteContract(true);
  const activeAccount = useWalletsActiveAccount();
  const doVoteSupernode = useCallback(() => {
    if (supernodeVoteContract) {
      setSending(true);
      // function voteOrApproval(bool _isVote, address _dstAddr, uint[] memory _recordIDs) external;
      supernodeVoteContract.voteOrApproval(true, supernodeInfo.addr, accountRecordIds, {
        // gasLimit: 1000000
      })
        .then((response: any) => {
          const { hash, data } = response;
          setTransactionResponse(response);
          addTransaction({ to: supernodeVoteContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeVoteContract.address,
              input: data,
              value: "0"
            }
          });
          setTxHash(hash);
          setSending(false);
        }).catch((err: any) => {
          setErr(err);
          setSending(false);
        })
    }
  }, [accountRecordIds, supernodeInfo, supernodeVoteContract, activeAccount]);

  return <>
    <Modal footer={null} destroyOnClose title={"wallet_supernodes_votes"} width="600px" open={openVoteModal} onCancel={cancel}>
      <Divider />
      {
        render
      }
      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{totalCheckedAccountRecordAmount.toFixed(6)} SAFE</Text>
        </Col>
      </Row>
      <Row >
        <Col span={24}>
          <Text type="secondary">{t("wallet_send_from")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text>{t("wallet_account_locked")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "15px" }} >
          <div style={{ maxHeight: "200px", overflowY: "scroll" }}>
            <Checkbox.Group
              options={options}
              value={accountRecordIds}
            />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={24}>
          <Text type="secondary">{t("wallet_supernodes_votes_to")}</Text>
        </Col>
        <Col span={24} style={{ paddingLeft: "5px" }} >
          <Text strong>{t("supernode")}</Text>
        </Col>
        <Divider style={{ margin: "8px 0px" }} />
        <Col span={24}>
          <Card size="small">
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
