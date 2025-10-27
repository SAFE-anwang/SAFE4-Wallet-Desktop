

import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Checkbox, Card, Alert } from "antd"
import { useCallback, useEffect, useState } from "react";
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
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import EstimateTx from "../../../../utils/EstimateTx";
import { TxExecuteStatus } from "../../safe3/Safe3";
import { CheckCircleFilled, CloseCircleFilled, SyncOutlined } from "@ant-design/icons";
import Safescan, { SafescanComponentType } from "../../../components/Safescan";

const { Text, Link } = Typography;

const Batch_Vote_AccountRecords_Limit = 20;

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
  const { provider, chainId } = useWeb3React();

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
  const [batchVoteTxns, setBatchVoteTxns] = useState<TxExecuteStatus[]>();
  const Batch_Withdraw_Prepare_Txns = Math.ceil(accountRecords.length / Batch_Vote_AccountRecords_Limit);

  const doBatchVoteSupernode = useCallback(async () => {
    if (supernodeVoteContract && provider && chainId) {
      setSending(true);
      let batchVoteTxns: TxExecuteStatus[] = [];

      for (let i = 0; i < Batch_Withdraw_Prepare_Txns; i++) {
        const start = i * Batch_Vote_AccountRecords_Limit;
        const ids = accountRecords.slice(
          start, start + Batch_Vote_AccountRecords_Limit
        ).map(accountRecord => accountRecord.id);
        console.log("==> Vote.ids =>", ids);
        let batch_withdraw_txn: TxExecuteStatus = {
          status: 2
        };
        batchVoteTxns.push(batch_withdraw_txn)
        setBatchVoteTxns([
          ...batchVoteTxns
        ]);
        const data = supernodeVoteContract.interface.encodeFunctionData("voteOrApproval", [
          true, supernodeInfo.addr, ids
        ]);
        let tx: ethers.providers.TransactionRequest = {
          to: supernodeVoteContract.address,
          data,
          chainId
        };
        try {
          tx = await EstimateTx(activeAccount, chainId, tx, provider);
          const { signedTx, error } = await window.electron.wallet.signTransaction(
            activeAccount,
            tx
          );
          if (signedTx) {
            const response = await provider.sendTransaction(signedTx);
            const { hash, data } = response;
            addTransaction({ to: supernodeVoteContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeVoteContract.address,
                input: data,
                value: "0"
              }
            });
            batchVoteTxns[i] = {
              status: 1,
              txHash: hash
            }
          }
          if (error) {
            batchVoteTxns[i] = {
              status: 0,
              error
            }
          }
        } catch (err) {
          console.log("Catch Error ==>", err)
          batchVoteTxns[i] = {
            status: 0,
            error: err
          }
        } finally {
          setBatchVoteTxns([
            ...batchVoteTxns
          ])
        }
        setSending(false);
      }

    }
  }, [accountRecordIds, supernodeInfo, supernodeVoteContract, activeAccount]);

  const cancel = useCallback(() => {
    setOpenVoteModal(false);
    if (batchVoteTxns && batchVoteTxns?.length > 0) {
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    }
  }, [batchVoteTxns]);

  return <>
    <Modal footer={null} destroyOnClose title={t("wallet_supernodes_votes")} width="600px" open={openVoteModal} onCancel={cancel}>
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

      {
        batchVoteTxns && <Row>
          <Divider />
          <Col span={24}>
            <Alert type="success" message={<>
              {
                batchVoteTxns.map(txn => {
                  const { txHash, status, error } = txn;
                  return <>
                    <Row>
                      <Col span={3}>
                        <Text type="secondary" style={{ fontFamily: "monospace" }}>
                          [
                          <Text>
                            {batchVoteTxns.indexOf(txn) + 1}
                          </Text>/{Batch_Withdraw_Prepare_Txns}]
                        </Text>
                        <Text style={{ float: "right" }}>:</Text>
                      </Col>

                      <Col span={18} style={{ paddingLeft: "5px" }}>
                        {status == 2 && <SyncOutlined spin />}
                        {status == 1 && <CheckCircleFilled style={{ marginRight: "5px", color: "#0bc50b" }} />}
                        {status == 0 && <CloseCircleFilled style={{ marginRight: "5px", color: "red" }} />}
                        {
                          txHash && <Text ellipsis style={{ width: "90%" }}>
                            {txHash}
                          </Text>
                        }
                        {
                          error && <Text>
                            {error.reason && JSON.stringify(error.reason)}
                          </Text>
                        }

                      </Col>
                      <Col span={3} style={{ textAlign: "right" }}>
                        {
                          txHash && <Safescan type={SafescanComponentType.Link} url={`/tx/${txHash}`} />
                        }
                      </Col>
                    </Row>
                  </>
                })
              }
            </>} />
          </Col>
        </Row>
      }

      <Divider></Divider>
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          <Button loading={sending} type="primary" onClick={() => {
            if (!sending && !batchVoteTxns) {
              doBatchVoteSupernode();
            } else {
              cancel();
            }
          }} style={{ float: "right" }}>
            {
              !sending && !batchVoteTxns && "广播交易"
            }
            {
              sending && "正在发送"
            }
            {
              !sending && batchVoteTxns && "关闭"
            }
          </Button>
        </Col>
      </Row>

    </Modal>
  </>

}
