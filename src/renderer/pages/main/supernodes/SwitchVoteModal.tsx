import { Alert, Button, Card, Col, Divider, Modal, Progress, Row, Typography } from "antd"
import { SupernodeInfo } from "../../../structs/Supernode";
import { useTranslation } from "react-i18next";
import { RenderNodeState } from "./Supernodes";
import AddressComponent from "../../components/AddressComponent";
import { CurrencyAmount, JSBI } from "@uniswap/sdk";
import { useSupernodeVoteContract } from "../../../hooks/useContracts";
import { useEffect, useMemo, useState } from "react";
import SupernodeListSelector from "./SupernodeListSelector";
import VotersAccountRecords from "./SwitchVote/VotersAccountRecords";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { TxExecuteStatus } from "../safe3/Safe3";
import Safescan from "../../components/Safescan";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import EstimateTx from "../../../utils/EstimateTx";

const { Text } = Typography;

export default ({
  supernodeInfo,
  openSwitchVoteModal, setOpenSwitchVoteModal
}: {
  supernodeInfo: SupernodeInfo
  openSwitchVoteModal: boolean,
  setOpenSwitchVoteModal: (openSwitchVoteModal: boolean) => void,
}) => {
  const { t } = useTranslation();
  const cancel = () => {
    setOpenSwitchVoteModal(false);
  }
  const supernodeVoteContract = useSupernodeVoteContract(true);
  const [totalVoteAmount, setTotalVoteAmount] = useState<CurrencyAmount>();
  const [switchSupernodeListSelector, setSwitchSupernodeListSelector] = useState<boolean>(false);
  const [newSupernodeInfo, setNewSupernodeInfo] = useState<SupernodeInfo>();
  const [selectAccountRecordIds, setSelectAccountRecords] = useState<number[]>();
  const addTransaction = useTransactionAdder();
  const activeAccount = useWalletsActiveAccount();
  const [txStatus, setTxStatus] = useState<TxExecuteStatus>();
  const [sending, setSending] = useState<boolean>(false);
  const [usedVotedIdsCache, setUsedVotedIdsCache] = useState<number[]>([]);
  const { provider, chainId } = useWeb3React();

  const showSupernodeInfo = useMemo(() => {
    return newSupernodeInfo ? newSupernodeInfo : supernodeInfo;
  }, [supernodeInfo, newSupernodeInfo]);
  const switchAble = useMemo(() => {
    if (txStatus) {
      return false;
    }
    if (selectAccountRecordIds && newSupernodeInfo) {
      return (selectAccountRecordIds.length > 0);
    }
    return false;
  }, [txStatus, selectAccountRecordIds, newSupernodeInfo]);

  useEffect(() => {
    if (supernodeVoteContract) {
      // function getTotalAmount(address _addr) external view returns (uint);
      supernodeVoteContract.callStatic.getTotalAmount(newSupernodeInfo ? newSupernodeInfo.addr : supernodeInfo.addr)
        .then(data => { setTotalVoteAmount(CurrencyAmount.ether(data)) })
    }
  }, [supernodeVoteContract, supernodeInfo, newSupernodeInfo]);

  const switchVote = async () => {
    if (supernodeVoteContract && selectAccountRecordIds && newSupernodeInfo && provider && chainId) {
      setSending(true);
      // function voteOrApproval(bool _isVote, address _dstAddr, uint[] memory _recordIDs) external;
      const data = supernodeVoteContract.interface.encodeFunctionData("voteOrApproval", [
        true, newSupernodeInfo.addr, selectAccountRecordIds
      ]);
      let tx: ethers.providers.TransactionRequest = {
        to: supernodeVoteContract.address,
        data,
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);
      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );
      if (signedTx) {
        try {
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
          setTxStatus({
            txHash: hash,
            status: 1,
          });
          usedVotedIdsCache.push(...selectAccountRecordIds);
          setUsedVotedIdsCache([...usedVotedIdsCache]);
        } catch (err) {
          setTxStatus({
            status: 0,
            error: err
          })
        } finally {
          setSending(false);
        }
      }
      if (error) {
        setSending(false);
        setTxStatus({
          status: 0,
          error
        })
      }
    }
  }

  return <Modal width={1200} destroyOnClose title="投票变更" open={openSwitchVoteModal} footer={null} onCancel={cancel}>
    <Divider />
    <VotersAccountRecords selectAccountRecordIdCallback={(selectAccountRecordIds) => {
      setSelectAccountRecords(selectAccountRecordIds);
      if (selectAccountRecordIds.length > 0) {
        setTxStatus(undefined);
      }
    }} supernodeInfo={supernodeInfo} usedVotedIdsCache={usedVotedIdsCache} />
    {
      switchSupernodeListSelector && <>
        <Divider />
        <SupernodeListSelector disabledSNAddresses={[]} selectCallback={(selectSupernodeNode: SupernodeInfo) => {
          setNewSupernodeInfo(selectSupernodeNode);
          setSwitchSupernodeListSelector(false);
        }} />
      </>
    }
    {
      !switchSupernodeListSelector && <>
        <Card title={<>
          {
            newSupernodeInfo && <Button onClick={() => setSwitchSupernodeListSelector(true)}>
              选择新的超级节点
            </Button>
          }
          {
            !newSupernodeInfo && <Button onClick={() => setSwitchSupernodeListSelector(true)} type="primary">
              选择新的超级节点
            </Button>
          }
        </>} style={{ width: "100%", marginTop: "50px" }}>
          <Row>
            <Col span={16}>
              <Row>
                <Col span={6}>
                  <Text type='secondary'>{t("node_id")}</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{showSupernodeInfo.id}</Text>
                </Col>
              </Row>
              <Row style={{ marginTop: "5px" }}>
                <Col span={6}>
                  <Text type='secondary'>{t("node_state")}</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{RenderNodeState(showSupernodeInfo.state, t)}</Text>
                </Col>
              </Row>
              <Row style={{ marginTop: "5px" }}>
                <Col span={6}>
                  <Text type='secondary'>{t("node_address")}</Text>
                </Col>
                <Col span={16}>
                  <Text strong>
                    <AddressComponent address={showSupernodeInfo.addr} qrcode copyable />
                  </Text>
                </Col>
              </Row>
              <Row style={{ marginTop: "5px" }}>
                <Col span={6}>
                  <Text type='secondary'>{t("node_name")}</Text>
                </Col>
                <Col span={18}>
                  <Text strong>{showSupernodeInfo.name}</Text>
                </Col>
              </Row>
              <Row style={{ marginTop: "5px" }}>
                <Col span={6}>
                  <Text type='secondary'>{t("node_creator")}</Text>
                </Col>
                <Col span={16}>
                  <Text strong>
                    <AddressComponent address={showSupernodeInfo.creator} qrcode copyable />
                  </Text>
                </Col>
              </Row>
            </Col>
            <Col span={8}>
              <Text type='secondary'>{t("wallet_supernodes_incentiveplan")}</Text><br /><br />
              <Row>
                <Col span={10}>
                  <Text strong>{t("wallet_supernodes_incentiveplan_creator")} {showSupernodeInfo.incentivePlan.creator}%</Text>
                </Col>
                <Col span={14}>
                  <Progress percent={showSupernodeInfo.incentivePlan.creator} showInfo={false} />
                </Col>
              </Row>
              <Row>
                <Col span={10}>
                  <Text strong>{t("wallet_supernodes_incentiveplan_members")} {showSupernodeInfo.incentivePlan.partner}%</Text>
                </Col>
                <Col span={14}>
                  <Progress percent={showSupernodeInfo.incentivePlan.partner} showInfo={false} />
                </Col>
              </Row>
              <Row>
                <Col span={10}>
                  <Text strong>{t("wallet_supernodes_incentiveplan_voters")} {showSupernodeInfo.incentivePlan.voter}%</Text>
                </Col>
                <Col span={14}>
                  <Progress percent={showSupernodeInfo.incentivePlan.voter} showInfo={false} />
                </Col>
              </Row>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={4}>
              <Text type='secondary'>{t("wallet_supernodes_createstake")}</Text>
            </Col>
            <Col span={20}>
              <Text strong>
                {
                  showSupernodeInfo.founders.reduce<CurrencyAmount>(
                    (totalFoundersAmount, founder) => totalFoundersAmount.add(founder.amount),
                    CurrencyAmount.ether(JSBI.BigInt("0"))
                  ).toFixed(6)
                } SAFE
              </Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={4}>
              <Text type='secondary'>{t("wallet_supernodes_votestake")}</Text>
            </Col>
            <Col span={20}>
              <Text strong>
                {totalVoteAmount?.toFixed(6)} SAFE
              </Text>
            </Col>
          </Row>
          <Row style={{ marginTop: "5px" }}>
            <Col span={4}>
              <Text type='secondary'>{t("node_description")}</Text>
            </Col>
            <Col span={20}>
              <Text strong>{showSupernodeInfo.description}</Text>
            </Col>
          </Row>
          <Divider />
          {
            newSupernodeInfo && <Alert style={{ marginBottom: "20px" }} type="info" message={<>
              <Text>将</Text><br />
              <Text strong type="secondary">超级节点-节点ID:{supernodeInfo.id}<Divider type="vertical" />{supernodeInfo.name}</Text><Text style={{ marginLeft: "20px" }}>中的已选锁仓</Text><br />
              {
                supernodeInfo.id != newSupernodeInfo.id && <>
                  <Text>转投到</Text><br />
                  <Text strong type="success">超级节点-节点ID:{newSupernodeInfo.id}<Divider type="vertical" />{newSupernodeInfo.name}</Text>
                </>
              }
              {
                supernodeInfo.id == newSupernodeInfo.id && <>
                  <Text>追加投票质押期限</Text><br />
                </>
              }
            </>} />
          }
          {
            txStatus && txStatus.txHash && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="success" message={<>
                <Row>
                  <Col span={24}>
                    <Text type="secondary">交易哈希</Text>
                  </Col>
                  <Col span={16}>{txStatus.txHash}</Col>
                  <Col span={8} style={{ textAlign: "right" }}>
                    <Safescan url={`/tx/${txStatus.txHash}`} />
                  </Col>
                </Row>
              </>} />
            </>
          }
          {
            txStatus && txStatus.error && <>
              <Alert style={{ marginBottom: "10px" }} showIcon type="error" message={<>
                <Row>
                  <Col span={24}><Text type="secondary">交易错误</Text></Col>
                  <Col span={24}>{txStatus.error.reason}</Col>
                </Row>
              </>} />
            </>
          }
          <Button loading={sending} onClick={switchVote} type="primary" disabled={!switchAble}>
            {supernodeInfo.id != (newSupernodeInfo && newSupernodeInfo.id) ? "转投" : "追加投票质押期限"}
          </Button>
        </Card>
      </>
    }
  </Modal>
}
