
import { Alert, Button, Col, Row, Space, Statistic, Typography } from 'antd';
import { useSafe4Balance, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { AccountRecord, formatAccountRecord } from '../../../../structs/AccountManager';
import { useEffect, useMemo } from 'react';
import { ZERO } from '../../../../utils/CurrentAmountUtils';
import { useAccountManagerContract } from '../../../../hooks/useContracts';

const { Text } = Typography;

export default ({
  nextCallback, accountRecord
}: {
  nextCallback: () => void,
  accountRecord?: AccountRecord
}) => {

  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];

  const nextClick = useMemo( () => {
    if ( accountRecord ){
      return true;
    }
    return safe4balance?.avaiable?.amount.greaterThan(ZERO);
  } , [accountRecord] );

  return <>
    {
      accountRecord && <>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message={<>
            将锁仓账户中的<Text strong>锁定记录:[ID={accountRecord.id}]</Text>提现到当前钱包的普通账户
          </>} type="info" showIcon />
        </Space>
        <br /><br />
        <Statistic title={`锁定记录[ID=${accountRecord.id}]`} value={accountRecord.amount.toFixed(6) + " SAFE"} />
      </>
    }
    {
      !accountRecord && <>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message={<>
            将当前钱包的锁仓账户中的<Text strong>全部可用余额</Text>提现到当前钱包的普通账户
          </>} type="info" showIcon />
        </Space>
        <br /><br />
        <Statistic title="当前可用" value={safe4balance?.avaiable?.amount?.toFixed(6) + " SAFE"} />
      </>
    }
    <br /><br /><br /><br />
    <Row style={{ width: "100%", textAlign: "right" }}>
      <Col span={24}>
        <Button disabled={!nextClick} type="primary" style={{ float: "right" }} onClick={() => {
          nextCallback()
        }}>下一步</Button>
      </Col>
    </Row>

  </>
}
