import { Alert, Button, Col, Divider, Input, InputNumber, Row, Typography } from "antd"
import { AccountRecord } from "../../../../../structs/AccountManager"
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { DateTimeFormat } from "../../../../../utils/DateUtils";
import { LockOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { JSBI } from "@uniswap/sdk";
import { EmptyContract } from "../../../../../constants/SystemContracts";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default ({
  selectedAccountRecord,
  goNextCallback
}: {
  selectedAccountRecord: AccountRecord,
  goNextCallback: (addLockDay: number) => void
}) => {

  const { t } = useTranslation();
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();

  const {
    id, amount, unlockHeight, recordUseInfo
  } = selectedAccountRecord;

  const locked = unlockHeight > blockNumber;
  const unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;

  const isMemberOfNode = useMemo(() => {
    if (recordUseInfo && recordUseInfo.frozenAddr && recordUseInfo.frozenAddr != EmptyContract.EMPTY) {
      return true;
    }
    return false;
  }, [recordUseInfo])

  const [addLockDay, setAddLockDay] = useState<string>( isMemberOfNode ? "360" : "" );
  const [addLockDayError, setAddLockDayError] = useState<string>();

  const goNext = () => {
    let _addLockDayError;
    if (!addLockDay) {
      _addLockDayError = t("please_enter")+t("wallet_locked_addLockDay");
    } else {
      try {
        const _lockDay = JSBI.BigInt(addLockDay);
        if (JSBI.greaterThan(JSBI.BigInt(1), _lockDay)) {
          _addLockDayError = t("enter_correct")+t("days");
        }
        goNextCallback(Number(_lockDay));
      } catch (error) {
        _addLockDayError = t("enter_correct")+t("days");
      }
    }
    if (!_addLockDayError) {

    } else {
      setAddLockDayError(_addLockDayError);
    }
  }

  return <>
    <Row>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Alert type="info" showIcon message={<>
          {t("wallet_addlockdays_tipforid")} <Text strong type="secondary">[ID={selectedAccountRecord?.id}]</Text> {t("wallet_addlockdays_addlockday")}
        </>} />
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Text type="secondary">{t("wallet_locked_accountRecordLockId")}</Text>
        <br />
        <Text strong>
          {
            locked && <LockOutlined />
          }
          {id}
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">{t("wallet_locked_lockedAmount")}</Text>
        <br />
        <Text strong>{amount.toFixed(2)} SAFE</Text>
      </Col>
      <Col span={24} style={{ marginTop: "5px" }}>
        <Text type="secondary">{t("wallet_locked_unlockHeight")}</Text>
        <br />
        <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
        {
          unlockDateTime && <Text strong style={{ float: "right" }} type="secondary">[{unlockDateTime}]</Text>
        }
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      {
        isMemberOfNode &&
        <Col span={24}>
          <Alert style={{ marginBottom: "20px" }} showIcon type="info" message={t("wallet_addlockdays_tipfornode")} />
        </Col>
      }
      <Col span={24}>
        <Text type="secondary" strong>{t("wallet_locked_addLockDay")}</Text>
        <br />
        {
          !isMemberOfNode &&
          <Input placeholder={t("enter")+t("wallet_locked_addLockDay")} style={{ width: "30%" }} onChange={(event) => {
            const input = event.target.value.trim();
            setAddLockDay(input);
            setAddLockDayError(undefined);
          }} />
        }
        {
          isMemberOfNode &&
          <InputNumber size="large" defaultValue={360} step={360} min={360} max={3600} onKeyPress={(e) => e.preventDefault()} style={{ width: "30%" }} onChange={(value) => {
            setAddLockDay(value+"");
          }} />
        }
        <br />
        {
          addLockDayError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addLockDayError} />
        }
      </Col>
      <Divider style={{ marginTop: "20px", marginBottom: "20px" }} />
      <Col span={24}>
        <Button style={{ float: "right" }} type="primary" onClick={goNext}>{t("next")}</Button>
      </Col>
    </Row>
  </>

}
