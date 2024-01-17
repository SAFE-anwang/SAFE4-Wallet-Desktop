import { Row, Statistic, Card, Col, Table, Typography } from "antd";
import { useSafe4Balance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useEffect, useState } from "react";
import { useBlockNumber } from "../../../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract } from "../../../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../../../structs/AccountManager";
import { ColumnsType } from "antd/es/table";

const { Text } = Typography;


export default () => {

  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const blockNumber = useBlockNumber();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);

  useEffect(() => {
    if (blockNumber && accountManagerContract) {
      accountManagerContract.callStatic
        .getRecords(activeAccount)
        .then(_accountRecords => {
          const accountRecords: AccountRecord[] = _accountRecords.map(formatAccountRecord);
          const fragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
          if (accountRecords.length > 0 && fragment && multicallContract) {
            const calls = accountRecords.map(accountRecord => {
              return {
                address: accountManagerContract?.address,
                callData: accountManagerContract?.interface.encodeFunctionData(fragment, [accountRecord.id])
              }
            });
            multicallContract.callStatic.aggregate(calls.map(call => [call.address, call.callData]))
              .then((data) => {
                const _blockNumber = data[0].toNumber();
                for (let i = 0; i < data[1].length; i++) {
                  const _recordUserInfo = accountManagerContract?.interface.decodeFunctionResult(fragment, data[1][i])[0];
                  accountRecords[i].recordUseInfo = formatRecordUseInfo(_recordUserInfo);
                }
                setAccountRecords(accountRecords.filter(accountRecord => accountRecord.id != 0));
              })
          }else{
            setAccountRecords([]);
          }
        })
    }
  }, [activeAccount ,blockNumber, accountManagerContract]);

  const columns: ColumnsType<AccountRecord> = [
    {
      title: '标识',
      dataIndex: 'id',
      key: 'id',
      render: (id, accountRecord) => {
        return <>
          <Text>记录ID:{id}</Text><br />
        </>
      }
    },
    {
      title: '锁仓信息',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, accountRecord) => {
        return <>
          <Text>{amount.toFixed(6)}</Text><br />
          <Text>{accountRecord.unlockHeight}</Text>
        </>
      }
    },
    {
      title: '关联节点',
      dataIndex: 'id',
      key: '_id',
      render: (_, accountRecord) => {
        const { recordUseInfo } = accountRecord;
        return <>
          <Text>{recordUseInfo?.frozenAddr}</Text><br />
          <Text>{recordUseInfo?.unfreezeHeight}</Text>
        </>
      }
    },
    {
      title: '投票节点',
      dataIndex: 'id',
      key: '_id2',
      render: (_, accountRecord) => {
        return <>

        </>
      }
    }
  ];


  return <>
    <Card>
      <Row>
        <Statistic title="锁仓账户总余额" value={safe4balance?.total?.amount?.toFixed(6)} />
      </Row>
      <Row style={{ marginTop: "50px" }}>
        <Col span={8}>
          <Statistic title="当前可用" value={safe4balance?.avaiable?.amount?.toFixed(6)} />
        </Col>
        <Col span={8}>
          <Statistic title="已锁定" value={safe4balance?.locked?.amount?.toFixed(6)} />
        </Col>
        <Col span={8}>
          <Statistic title="使用中" value={safe4balance?.used?.amount?.toFixed(6)} />
        </Col>
      </Row>
    </Card>
    <Card title="锁仓列表" style={{ marginTop: "20px" }}>
      <Table dataSource={accountRecords} columns={columns} pagination={false} />
    </Card>

  </>



}
