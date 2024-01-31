import { Row, Statistic, Card, Col, Table, Typography, Button, Divider, Space, Tag } from "antd";
import { useActiveAccountAccountRecords, useSafe4Balance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { useAccountManagerContract, useMulticallContract } from "../../../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo, IdPageQuery } from "../../../../../structs/AccountManager";
import { ColumnsType } from "antd/es/table";
import { LockOutlined, RetweetOutlined, UnlockFilled, UnlockOutlined, UnlockTwoTone } from '@ant-design/icons';
import WalletWithdrawModal from "../../Withdraw/WalletWithdrawModal";
import { EmptyContract, SystemContract } from "../../../../../constants/SystemContracts";
import AddressView from "../../../../components/AddressView";
import { DateTimeFormat } from "../../../../../utils/DateUtils";

const { Text } = Typography;
const Get_Record_Account_ID_Page_Size = 50;

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const blockNumber = useBlockNumber();
  const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
  const [selectedAccountRecord, setSelectedAccountRecord] = useState<AccountRecord>();
  const accountRecords = useActiveAccountAccountRecords();
  const timestamp = useTimestamp();

  const RenderAccountRecord = useCallback((accountRecord: AccountRecord) => {
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
    const couldWithdraw = (!locked && blockNumber > unfreezeHeight && blockNumber > releaseHeight);
    const unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
    const unfreezeDateTime = unfreezeHeight - blockNumber > 0 ? DateTimeFormat(((unfreezeHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
    const releaseDateTime = releaseHeight - blockNumber > 0 ? DateTimeFormat(((releaseHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;

    return <Card key={id} size="small" style={{ marginBottom: "60px" }}>
      <Row>
        <Col span={6}>
          <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px", fontWeight: "600" }}>锁仓信息</Divider>
          <Text strong type="secondary">记录ID</Text><br />
          <Text strong>
            {
              locked && <LockOutlined />
            }
            {id}
          </Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">锁仓数量</Text><br />
          <Text strong>{amount.toFixed(2)} SAFE</Text>
          <Divider style={{ margin: "4px 0" }} />
          <Text strong type="secondary">解锁高度</Text><br />
          <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
          {
            unlockDateTime && <Text strong style={{ float: "right" }} type="secondary">[{unlockDateTime}]</Text>
          }
        </Col>
        <Col>
          <Divider type="vertical" style={{ height: "100%" }} />
        </Col>
        <Col span={17}>
          <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px" }}>使用信息</Divider>
          <Row>
            <Col span={16}>
              <Text strong type="secondary">关联节点</Text><br />
              {
                frozenAddr == EmptyContract.EMPTY && <>
                  <Tag>未关联</Tag>
                </>
              }
              {
                frozenAddr != EmptyContract.EMPTY && <>
                  <Text><AddressView address={frozenAddr} /></Text>
                </>
              }
            </Col>
            <Col span={8}>
              <Text strong type="secondary" style={{ float: "right" }}>质押释放</Text><br />
              <Text strong style={{ float: "right", color: unfreezeHeight > blockNumber ? "#104499" : "#27c92d" }}>
                {unfreezeHeight == 0 ? "-" : unfreezeHeight}
                {
                  unfreezeDateTime && <>
                    <Divider type="vertical" style={{ margin: "0px 4px" }} ></Divider>
                    <Text strong style={{ color: "#104499" }}>{unfreezeDateTime}</Text>
                  </>
                }
              </Text>
            </Col>
          </Row>
          <Divider style={{ margin: "4px 0" }} />
          <Row>
            <Col span={16}>
              <Text strong type="secondary">投票超级节点</Text><br />
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
            </Col>
            <Col span={8}>
              <Text strong type="secondary" style={{ float: "right" }}>质押释放</Text><br />
              <Text strong style={{ float: "right", color: releaseHeight > blockNumber ? "#104499" : "#27c92d" }}>
                {releaseHeight == 0 ? "-" : releaseHeight}
                {
                  releaseDateTime && <>
                    <Divider type="vertical" style={{ margin: "0px 4px" }} ></Divider>
                    <Text strong style={{ color: "#104499" }}>{releaseDateTime}</Text>
                  </>
                }
              </Text>
            </Col>
          </Row>
          <Divider style={{ margin: "4px 0" }} />
          <div style={{ lineHeight: "42px" }}>
            <Space style={{ float: "right", marginTop: "2px" }}>
              <Button title="提现" disabled={!couldWithdraw} size="small" type="primary" onClick={() => {
                setSelectedAccountRecord(accountRecord);
                setOpenWithdrawModal(true)
              }}>提现</Button>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  }, [blockNumber, timestamp]);

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
        accountRecords && accountRecords.map(RenderAccountRecord)
      }
    </Card>

    <WalletWithdrawModal selectedAccountRecord={selectedAccountRecord}
      openWithdrawModal={openWithdrawModal} setOpenWithdrawModal={setOpenWithdrawModal} />

  </>



}
