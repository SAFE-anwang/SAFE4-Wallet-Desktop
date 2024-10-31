
import { Alert, Button, Col, Row, Space, Statistic, Typography } from 'antd';
import { useSafe4Balance, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { AccountRecord, formatAccountRecord } from '../../../../structs/AccountManager';
import { useEffect, useMemo } from 'react';
import { ZERO } from '../../../../utils/CurrentAmountUtils';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export default ({
  nextCallback, accountRecord
}: {
  nextCallback: () => void,
  accountRecord?: AccountRecord
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];

  const nextClick = useMemo(() => {
    if (accountRecord) {
      return true;
    }
    return safe4balance?.avaiable?.amount.greaterThan(ZERO);
  }, [accountRecord]);

  return <>
    {
      accountRecord && <>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message={<>
            {t("wallet_withdraw_withdrawIDtip", { lockID: accountRecord.id })}
          </>} type="info" showIcon />
        </Space>
        <br /><br />
        <Statistic title={`${t("wallet_locked_accountRecordLockId")}[ID=${accountRecord.id}]`} value={accountRecord.amount.toFixed(6) + " SAFE"} />
      </>
    }
    {
      !accountRecord && <>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message={<>
            {t("wallet_withdraw_withdrawalltip")}
          </>} type="info" showIcon />
        </Space>
        <br /><br />
        <Statistic title={t("wallet_withdraw_currentavailable")} value={safe4balance?.avaiable?.amount?.toFixed(6) + " SAFE"} />
      </>
    }
    <br /><br /><br /><br />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        <Button disabled={!nextClick} type="primary" style={{ float: "right" }} onClick={() => {
          nextCallback()
        }}>{t("next")}</Button>
      </Col>
    </Row>

  </>
}
