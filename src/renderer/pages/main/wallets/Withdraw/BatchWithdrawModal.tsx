import { Alert, Button, Col, Divider, Modal, Row, Typography } from "antd"
import { AccountRecord } from "../../../../structs/AccountManager"
import { CurrencyAmount } from "@uniswap/sdk";
import { CheckCircleFilled, CheckCircleTwoTone, CloseCircleFilled, CloseCircleTwoTone, RetweetOutlined, SyncOutlined } from "@ant-design/icons";
import { useState } from "react";
import { TxExecuteStatus } from "../../safe3/Safe3";
import Safescan, { SafescanComponentType } from "../../../components/Safescan";
import { Contract, ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import EstimateTx from "../../../../utils/EstimateTx";
import { useTransactionAdder } from "../../../../state/transactions/hooks";

const { Text } = Typography;

// 在一笔批量提现交易中,可以提现的最大数量,该值在合约中的最大限制为20
const Batch_Withdraw_AccountRecords_Limit = 20;

export default ({
  openBatchWithdrawModal, setOpenBatchWithdrawModal,
  accountRecords,
  accountManagerContract
}: {
  openBatchWithdrawModal: boolean,
  setOpenBatchWithdrawModal: (openBatchWithdrawModal: boolean) => void,
  accountRecords: AccountRecord[],
  accountManagerContract: Contract
}) => {

  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();

  const cancel = () => {
    setOpenBatchWithdrawModal(false);
    setBatchWithdrawTxns(undefined);
  }

  const totalWithdrawAmount = accountRecords.reduce((total, accountRecord) => {
    total = total.add(accountRecord.amount);
    return total;
  }, CurrencyAmount.ether("0"));

  const Batch_Withdraw_Prepare_Txns = Math.ceil(accountRecords.length / Batch_Withdraw_AccountRecords_Limit);
  const doBatchWithdraw = async () => {
    if (!chainId || !provider) return;
    setSending(true);
    let batchWithdrawTxns: TxExecuteStatus[] = [];
    for (let i = 0; i < Batch_Withdraw_Prepare_Txns; i++) {
      const start = i * Batch_Withdraw_AccountRecords_Limit;
      const ids = accountRecords.slice(
        start, start + Batch_Withdraw_AccountRecords_Limit
      ).map(accountRecord => accountRecord.id);
      console.log("==> withdraw.ids =>", ids);
      let batch_withdraw_txn: TxExecuteStatus = {
        status: 2
      };
      batchWithdrawTxns.push(batch_withdraw_txn)
      setBatchWithdrawTxns([
        ...batchWithdrawTxns
      ])
      const data = accountManagerContract.interface.encodeFunctionData("withdrawByID", [
        ids,
      ]);

      let tx: ethers.providers.TransactionRequest = {
        to: accountManagerContract.address,
        data,
        chainId,
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
          addTransaction({ to: accountManagerContract.address }, response, {
            call: {
              from: activeAccount,
              to: accountManagerContract.address,
              input: data,
              value: "0"
            }
          });
          batchWithdrawTxns[i] = {
            status: 1,
            txHash: hash
          }
        }
        if (error) {
          batchWithdrawTxns[i] = {
            status: 0,
            error
          }
        }
      } catch (err) {
        console.log("Catch Error ==>", err)
        batchWithdrawTxns[i] = {
          status: 0,
          error: err
        }
      } finally {
        setBatchWithdrawTxns([
          ...batchWithdrawTxns
        ])
      }
    }
    setSending(false);
  }

  const [batchWithdrawTxns, setBatchWithdrawTxns] = useState<TxExecuteStatus[]>();

  const [sending, setSending] = useState<boolean>(false);

  return <Modal open={openBatchWithdrawModal} title="批量提现" footer={null} destroyOnClose onCancel={cancel}>
    <Divider />
    <Row>
      <Col span={24}>
        <Alert type="info" message={<>
          <Text>
            提现您选择的 <Text strong>{accountRecords.length}</Text> 个锁仓记录
          </Text>
        </>} />
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text strong style={{ fontSize: "32px" }}>
          <RetweetOutlined /> {totalWithdrawAmount.toExact()} SAFE
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">从</Text><br />
        <Text strong style={{ marginLeft: "5px" }}>锁仓账户</Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">到</Text><br />
        <Text strong style={{ marginLeft: "5px" }}>普通账户</Text>
      </Col>
    </Row>

    {
      batchWithdrawTxns && <Row>
        <Divider />
        <Col span={24}>
          <Alert type="success" message={<>
            {
              batchWithdrawTxns.map(txn => {
                const { txHash, status, error } = txn;
                return <>
                  <Row>
                    <Col span={3}>
                      <Text type="secondary" style={{ fontFamily: "monospace" }}>
                        [
                        <Text>
                          {batchWithdrawTxns.indexOf(txn) + 1}
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


    <Divider />
    <Row>
      <Col span={24}>
        <Button loading={sending} type="primary" onClick={() => {
          if (!sending && !batchWithdrawTxns) {
            doBatchWithdraw();
          } else {
            cancel();
          }
        }} style={{ float: "right" }}>
          {
            !sending && !batchWithdrawTxns && "广播交易"
          }
          {
            sending && "正在发送"
          }
          {
            !sending && batchWithdrawTxns && "关闭"
          }
        </Button>
      </Col>
    </Row>
  </Modal>
}
