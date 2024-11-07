
import { Col, Row, Avatar, List, Typography, Modal, Button, Divider } from "antd";
import { useMemo } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import TransactionElementTemplate from "./TransactionElementTemplate";
import { ApartmentOutlined, ClockCircleOutlined, ClusterOutlined, LockOutlined } from "@ant-design/icons";
import EtherAmount from "../../../../../utils/EtherAmount";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({ transaction, setClickTransaction, support }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void,
  support: {
    supportFuncName: string,
    inputDecodeResult: any
  },
}) => {
  const {
    status,
    call,
  } = transaction;
  const { value, lockId, addLockDay } = useMemo(() => {
    return {
      value: call?.value,
      lockId: support.inputDecodeResult._id,
      addLockDay: support.inputDecodeResult._day
    }
  }, [transaction, call, support]);
  const { t } = useTranslation();
  return <>
    <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
      {
        call && <>
          <TransactionElementTemplate
            icon={<ClockCircleOutlined style={{ color: "black" }} />}
            title={t("wallet_history_am_addlockdays")}
            status={status}
            description={<>
              <Text type="secondary">
                {t("wallet_locked_accountRecordLockId")}:<Text type="secondary" strong> {lockId} </Text>
                <Divider type="vertical" />
                {t("wallet_history_am_addlockdays")}:<Text type="secondary" strong> {addLockDay} </Text>{t("days")}
              </Text>
            </>}
            assetFlow={<>
              <Text type="secondary" strong>
                {value && EtherAmount({ raw: value, fix: 18 })} SAFE
              </Text>
            </>}
          />
        </>
      }
    </List.Item>
  </>

}
