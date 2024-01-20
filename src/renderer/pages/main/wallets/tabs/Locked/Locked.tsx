import { Row, Statistic, Card, Col, Table, Typography, Button, Divider, Space, Tag } from "antd";
import { useSafe4Balance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import { useCallback, useEffect, useState } from "react";
import { useBlockNumber } from "../../../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract } from "../../../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../../../structs/AccountManager";
import { ColumnsType } from "antd/es/table";
import { RetweetOutlined } from '@ant-design/icons';
import WalletWithdrawModal from "../../Withdraw/WalletWithdrawModal";
import { EmptyContract } from "../../../../../constants/SystemContracts";

const { Text } = Typography;


export default () => {

  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const blockNumber = useBlockNumber();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);
  const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
  const [selectedAccountRecord, setSelectedAccountRecord] = useState<AccountRecord>();

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
          } else {
            setAccountRecords([]);
          }
        })
    }
  }, [activeAccount, blockNumber, accountManagerContract]);

  const columns: ColumnsType<AccountRecord> = [
    {
      title: '基本信息',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id, accountRecord) => {
        const couldWithdraw = blockNumber >= accountRecord.unlockHeight;
        return <>
          <Text strong type="secondary">记录ID</Text><br />
          <Text strong>{id}</Text>
          {
            couldWithdraw && <Button style={{ float: "right" }} onClick={() => {
              setSelectedAccountRecord(accountRecord);
              setOpenWithdrawModal(true);
            }}>提现</Button>
          }
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">锁仓数量</Text><br />
          <Text strong>{accountRecord.amount.toFixed(6)} SAFE</Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">解锁高度</Text><br />
          <Text>{accountRecord.unlockHeight}</Text>
          <Text style={{ float: "right" }}>2023-02-02 12:12:12</Text>
        </>
      }
    },
    {
      title: '使用信息',
      dataIndex: 'amount',
      key: 'amount',
      width: 400,
      render: (amount, accountRecord) => {
        const couldWithdraw = blockNumber >= accountRecord.unlockHeight;
        return <>
          <Text>{amount.toFixed(6)}</Text><br />
          <Text>{accountRecord.unlockHeight}</Text>

        </>
      }
    }
  ];

  const RenderAccountRecord = function (accountRecord: AccountRecord) {
    const {
      id, amount, unlockHeight, recordUseInfo
    } = accountRecord;
    const {
      frozenAddr, freezeHeight, unfreezeHeight,
      votedAddr, voteHeight, releaseHeight
    } = recordUseInfo ? recordUseInfo : {
      frozenAddr: EmptyContract.EMPTY,
      freezeHeight: 0,
      unfreezeHeight: 0,
      votedAddr: EmptyContract.EMPTY,
      voteHeight: 0,
      releaseHeight: 0
    }
    const locked = unlockHeight > blockNumber;

    return <Card key={id} size="small" style={{ marginBottom: "60px" }}>
      <Row>
        <Col span={7}>
          <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px", fontWeight: "600" }}>锁仓信息</Divider>
          <Text strong type="secondary">记录ID</Text><br />
          <Text strong>{id}</Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">锁仓数量</Text><br />
          <Text strong>{amount.toFixed(6)} SAFE</Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">解锁高度</Text><br />
          <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
          <Text style={{ float: "right" }}></Text>
        </Col>
        <Col>
          <Divider type="vertical" style={{ height: "100%" }} />
        </Col>
        <Col span={16}>
          <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px" }}>使用信息</Divider>
          <Text strong type="secondary">关联主节点</Text>
          <Text strong type="secondary" style={{ float: "right" }}>抵押释放</Text><br />
          {
            frozenAddr == EmptyContract.EMPTY && <>
              <Tag>未关联</Tag>
            </>
          }
          {
            frozenAddr != EmptyContract.EMPTY && <>
              <Text>{frozenAddr}</Text>
            </>
          }
          <Text strong type="secondary" style={{ float: "right" }}>
            {unfreezeHeight == 0 ? "-" : ""}
          </Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">投票超级节点</Text>
          <Text strong type="secondary" style={{ float: "right" }}>抵押释放</Text><br />
          {
            votedAddr == EmptyContract.EMPTY && <>
              <Tag>未投票</Tag>
            </>
          }
          {
            votedAddr != EmptyContract.EMPTY && <>
              <Text>{votedAddr}</Text>
            </>
          }
          <Text strong type="secondary" style={{ float: "right" }}>
            {releaseHeight == 0 ? "-" : ""}
          </Text>
          <Divider style={{ margin: "4px 0" }} />
          <div style={{ lineHeight: "42px" }}>
            <Space style={{ float: "right", marginTop: "2px" }}>
              <Button title="提现" disabled={locked} size="small" type="primary" onClick={() => {
                setSelectedAccountRecord(accountRecord);
                setOpenWithdrawModal(true)
              }}>提现</Button>
              <Button size="small" style={{ float: "right" }}>追加锁仓</Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  }

  return <>
    <Row>
      <Col span={18}>
        <Statistic title="锁仓账户总余额" value={safe4balance?.total?.amount?.toFixed(6)} />
      </Col>
      <Col span={6}>
        <Row>
          <Col offset={16} span={8} style={{ textAlign: "center" }}>
            <Button style={{
              height: "45px", width: "45px"
            }} size='large' shape="circle" icon={<RetweetOutlined />} onClick={() => {
              setSelectedAccountRecord(undefined);
              setOpenWithdrawModal(true)
            }
            } /><br />
            <Text>提现</Text>
          </Col>
        </Row>
      </Col>
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

    <Card title="锁仓列表" style={{ marginTop: "40px" }}>
      {
        accountRecords && accountRecords.sort((a1, a2) => a2.id - a1.id).map(RenderAccountRecord)
      }
    </Card>

    <WalletWithdrawModal selectedAccountRecord={selectedAccountRecord}
      openWithdrawModal={openWithdrawModal} setOpenWithdrawModal={setOpenWithdrawModal} />

  </>



}
