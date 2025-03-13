import { Row, Alert, Col, Tag, Typography, Divider, Card, Spin, Button, Tooltip } from "antd"
import { LoadingOutlined, CheckCircleFilled, CloseCircleFilled, ExportOutlined, GlobalOutlined } from '@ant-design/icons';
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TransactionDetails } from "../../../../../../state/transactions/reducer";
import { useTransaction } from "../../../../../../state/transactions/hooks";
import { useWalletsActiveAccount } from "../../../../../../state/wallets/hooks";
import DecodeSupportFunction from "../../../../../../constants/DecodeSupportFunction";
import { DateTimeFormat } from "../../../../../../utils/DateUtils";
import TokenLogo from "../../../../../components/TokenLogo";
import Safescan from "../../../../../components/Safescan";
import AddressView from "../../../../../components/AddressView";
import EtherAmount from "../../../../../../utils/EtherAmount";
import TransactionDetailsCallSupport from "./TransactionDetailsCallSupport";

const { Text } = Typography;

export default ({
  transaction
}: {
  transaction: TransactionDetails
}) => {
  const tx = useTransaction(transaction.hash);
  const {
    hash,
    status,
    receipt,
    transfer,
    timestamp,
    addedTime,
    call
  } = useMemo(() => {
    if (tx && tx.hash) {
      return tx;
    }
    return {
      hash: undefined,
      status: undefined,
      receipt: undefined,
      transfer: undefined,
      timestamp: undefined,
      addedTime: undefined,
      call: undefined
    }
  }, [tx])
  const activeAccount = useWalletsActiveAccount();
  const { t } = useTranslation();
  const support = DecodeSupportFunction(call?.to, call?.input, call?.from);
  return <>
    <Row>
      <Col span={24}>
        {
          status == 1 && <>
            <CheckCircleFilled style={{
              color: "#52c41a", fontSize: "50px", float: "left", marginRight: "20px", marginLeft: "20px"
            }} />
            <div>
              <Text style={{ fontSize: "16px" }}>{t("wallet_txdetails_state_success")}</Text><br />
              <Text style={{ fontSize: "16px" }} type="secondary">{DateTimeFormat(addedTime)}</Text>
            </div>
          </>
        }
        {
          status == undefined && <>
            <Spin style={{ float: "left" }} indicator={
              <LoadingOutlined style={{ fontSize: "50px", marginRight: "20px", marginLeft: "20px" }}
              />} >
            </Spin>
            <div>
              <Text style={{ fontSize: "16px" }}>{t("wallet_txdetails_state_pending")}</Text><br />
              <Text style={{ fontSize: "16px" }} type="secondary">{addedTime && DateTimeFormat(addedTime)}</Text>
            </div>
          </>
        }
        {
          status == 0 && <>
            <CloseCircleFilled style={{
              color: "#e53d3d", fontSize: "50px", float: "left", marginRight: "20px", marginLeft: "20px"
            }} />
            <div>
              <Text style={{ fontSize: "16px" }}>{t("wallet_txdetails_state_failed")}</Text><br />
              <Text style={{ fontSize: "16px" }} type="secondary">{DateTimeFormat(addedTime)}</Text>
            </div>
          </>
        }
      </Col>
    </Row>

    <Divider />

    <Text type="secondary" style={{ fontSize: "12px" }}>{t("wallet_txdetails_details")}</Text><br />
    <Card style={{ marginTop: "8px" }}>
      <Row>
        <Col span={12}>
          <Text type="secondary">{t("transactionHash")}</Text>
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Safescan url={`/tx/${hash}`} />
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Text>{hash}</Text>
        </Col>
      </Row>
    </Card>
    <br />
    {
      /** transfer 交易 */
      transfer && <>
        <Text type="secondary" style={{ fontSize: "12px" }}>{t("transaction")}</Text><br />
        <Card title={<>
          <TokenLogo />
          <Text strong style={{ fontSize: "16px", lineHeight: "32px", marginLeft: "10px" }}>
            {
              activeAccount == transfer.from && <>{t("wallet_send")}</>
            }
            {
              activeAccount == transfer.to && <>{t("wallet_receive")}</>
            }
          </Text>
        </>} style={{ marginTop: "8px" }}>
          {
            activeAccount == transfer.from && <>
              <Text style={{ fontSize: "28px" }} strong>-{EtherAmount({ raw: transfer.value })} SAFE</Text>
            </>
          }
          {
            activeAccount == transfer.to && <>
              <Text style={{ fontSize: "28px", color: "green" }} strong>+{EtherAmount({ raw: transfer.value })} SAFE</Text>
            </>
          }
          <br /><br />
          <Text type="secondary">{t("wallet_send_from")}</Text><br />
          <div style={{ marginLeft: "5px" }}><AddressView address={transfer.from} /></div><br />
          <Text type="secondary">{t("wallet_send_to")}</Text><br />
          <div style={{ marginLeft: "5px" }}><AddressView address={transfer.to} /></div><br />
        </Card>
      </>
    }
    {
      support && <TransactionDetailsCallSupport support={support} transaction={tx} />
    }
  </>

}
