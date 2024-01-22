

import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Checkbox, Card } from "antd"
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { SupernodeInfo } from "../../../../structs/Supernode";
import { AccountRecord } from "../../../../structs/AccountManager";
import AddressView from "../../../components/AddressView";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { useSupernodeVoteContract } from "../../../../hooks/useContracts";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useTransactionAdder } from "../../../../state/transactions/hooks";
import { SearchOutlined, SendOutlined, QrcodeOutlined, LockOutlined } from '@ant-design/icons';
import Alert from "antd/es/alert/Alert";

const { Text , Link } = Typography;

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

  const [sending, setSending] = useState<boolean>(false);
  const [showErrorDetail, setShowErrorDetail] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<{
    txHash: string | null,
    error: any | null
  }>();
  const addTransaction = useTransactionAdder();
  const cancel = () => {
    setOpenVoteModal(false);
  }

  const options = accountRecords.map(accountRecord => {
    return {
      label: <>
        <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
          <Row>
            <Col>锁仓记录ID:</Col>
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
      supernodeVoteContract.voteOrApproval(true, supernodeInfo.addr, accountRecordIds)
        .then((response: any) => {
          const { hash, data } = response;
          setRpcResponse({
            txHash: hash,
            error: null
          });
          addTransaction({ to: supernodeVoteContract.address }, response, {
            call: {
              from: activeAccount,
              to: supernodeVoteContract.address,
              input: data,
              value: "0"
            }
          });
        }).catch((err: any) => {
          setSending(false);
          setRpcResponse({
            txHash: null,
            error: err
          });
        })
    }
  }, [accountRecordIds, supernodeInfo, supernodeVoteContract, activeAccount]);

  return <>
    <Modal footer={null} destroyOnClose title="投票" width="600px" open={openVoteModal} onCancel={cancel}>
      <Divider />
      <div style={{ marginBottom: "20px" }}>
        {
          rpcResponse?.error && <Alert
            message="错误"
            description={
              <>
                <Text>{rpcResponse.error.reason}</Text>
                <br />
                {
                  !showErrorDetail && <Link onClick={() => {
                    setShowErrorDetail(true)
                  }}>[查看错误信息]</Link>
                }
                {
                  showErrorDetail && <>
                    {JSON.stringify(rpcResponse.error)}
                  </>
                }
              </>
            }
            type="error"
            showIcon
          />
        }
        {
          rpcResponse?.txHash && <Alert
            message="交易哈希"
            description={
              <>
                <Text>{rpcResponse.txHash}</Text>
              </>
            }
            type="success"
            showIcon
          />
        }
      </div>
      <br />
      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>{totalCheckedAccountRecordAmount.toFixed(6)} SAFE</Text>
        </Col>
      </Row>
      <Row >
        <Col span={24}>
          <Text strong>从</Text>
          <br />
          <Text style={{ marginLeft: "10px", fontSize: "18px" }}>锁仓账户</Text>
          <br /><br />
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
          <Text strong>到</Text>
        </Col>
        <Col span={24}>
          <Card size="small">
            <Text type="secondary">地址</Text><br />
            <Text><AddressView address={supernodeInfo.addr} /></Text><br />
            <Text type="secondary">名称</Text><br />
            <Text>{supernodeInfo.name}</Text>
          </Card>
        </Col>
      </Row>
      <Divider></Divider>
      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {
            !sending && !rpcResponse && <Button icon={<LockOutlined />} onClick={() => {
              doVoteSupernode();
            }} disabled={sending} type="primary" style={{ float: "right" }}>
              发送交易
            </Button>
          }
          {
            sending && !rpcResponse && <Button loading disabled type="primary" style={{ float: "right" }}>
              发送中....
            </Button>
          }
          {
            rpcResponse && <Button onClick={close} type="primary" style={{ float: "right" }}>
              关闭
            </Button>
          }
        </Col>
      </Row>

    </Modal>
  </>

}
