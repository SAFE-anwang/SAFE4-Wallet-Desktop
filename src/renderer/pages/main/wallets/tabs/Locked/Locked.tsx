import { Row, Statistic, Card, Col, Table, Typography, Button, Divider, Space, Tag, List } from "antd";
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
import { ZERO } from "../../../../../utils/CurrentAmountUtils";

const { Text } = Typography;
const AccountRecords_Page_Size = 5;

export default () => {

  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const blockNumber = useBlockNumber();
  const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
  const [selectedAccountRecord, setSelectedAccountRecord] = useState<AccountRecord>();
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);
  const timestamp = useTimestamp();
  const accountManagerContract = useAccountManagerContract();
  const multicallContract = useMulticallContract();
  const [loading, setLoading] = useState<boolean>(false);
  const [accountRecordZERO, setAccountRecordZERO] = useState<AccountRecord>();

  useEffect(() => {
    if (accountManagerContract) {
      // function getRecord0(address _addr) external view returns (AccountRecord memory);
      accountManagerContract.callStatic.getRecord0(activeAccount)
        .then(_accountRecord => {
          const accountRecordZERO = formatAccountRecord(_accountRecord);
          if (accountRecordZERO.amount.greaterThan(ZERO)) {
            setAccountRecordZERO(accountRecordZERO)
          }
        })
        .catch((err: any) => {
          console.log("get zero error:", err)
        })
    }
  }, [accountManagerContract, blockNumber, activeAccount]);

  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    onChange?: (page: number) => void
  }>();

  const initilizePageQuery = useCallback(() => {
    if (accountManagerContract) {
      // function getTotalAmount(address _addr) external view returns (uint, uint);
      accountManagerContract.callStatic.getTotalAmount(activeAccount)
        .then((data: any) => {
          const pagination = {
            total: data[1].toNumber(),
            pageSize: AccountRecords_Page_Size,
            position: "bottom",
            current: 1,
            onChange: (page: number) => {
              pagination.current = page;
              setPagination({
                ...pagination
              })
            }
          }
          setPagination({
            ...pagination,
          })
        })
    }
  }, [accountManagerContract]);

  useEffect(() => {
    if (pagination && pagination.current != 1) {
      // 如果已经刷新过数据且不是第一页的情况下,不自动刷新数据.
      return;
    }
    initilizePageQuery();
  }, [blockNumber]);

  useEffect(() => {
    initilizePageQuery();
  }, [accountManagerContract, activeAccount]);

  useEffect(() => {
    if (pagination && accountManagerContract && multicallContract) {
      const { pageSize, current, total } = pagination;
      if (current && pageSize && total && total > 0) {
        //////////////////// 逆序 ////////////////////////
        let position = total - (pageSize * current);
        let offset = pageSize;
        if (position < 0) {
          offset = pageSize + position;
          position = 0;
        }
        /////////////////////////////////////////////////
        // function getTotalIDs(address _addr, uint _start, uint _count) external view returns (uint[] memory);
        setLoading(true);
        accountManagerContract.getTotalIDs(activeAccount, position, offset)
          .then((accountRecordIds: any) => {
            multicallGetAccountRecordByIds(accountRecordIds);
          })
      } else {
        setAccountRecords([]);
      }
    }
  }, [pagination]);

  const multicallGetAccountRecordByIds = useCallback((_accountRecordIds: any) => {
    if (multicallContract && accountManagerContract) {
      const accountRecordIds = _accountRecordIds.map((_id: any) => _id.toNumber())
        .filter((id: number) => id > 0)
      // .sort((id0: number, id1: number) => id1 - id0)
      const getRecordByIDFragment = accountManagerContract?.interface?.getFunction("getRecordByID");
      const getRecordUseInfoFragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
      const getRecordByIDCalls = [];
      const getRecordUseInfoCalls = [];
      for (let i = 0; i < accountRecordIds.length; i++) {
        getRecordByIDCalls.push([
          accountManagerContract.address,
          accountManagerContract?.interface.encodeFunctionData(getRecordByIDFragment, [accountRecordIds[i]])
        ]);
        getRecordUseInfoCalls.push([
          accountManagerContract.address,
          accountManagerContract?.interface.encodeFunctionData(getRecordUseInfoFragment, [accountRecordIds[i]])
        ]);
      }
      const accountRecords: AccountRecord[] = [];
      multicallContract.callStatic.aggregate(getRecordByIDCalls.concat(getRecordUseInfoCalls))
        .then(data => {
          const raws = data[1];
          const half = raws.length / 2;
          for (let i = half - 1; i >= 0; i--) {
            const _accountRecord = accountManagerContract?.interface.decodeFunctionResult(getRecordByIDFragment, raws[i])[0];
            const _recordUseInfo = accountManagerContract?.interface.decodeFunctionResult(getRecordUseInfoFragment, raws[half + i])[0];
            const accountRecord = formatAccountRecord(_accountRecord);
            accountRecord.recordUseInfo = formatRecordUseInfo(_recordUseInfo);
            accountRecords.push(accountRecord);
          }
          setLoading(false);
          setAccountRecords(accountRecords);
        })
    }
  }, [multicallContract, accountManagerContract, pagination]);

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
    return <Card key={id} size="small" style={{ marginTop: "30px" }}>
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
        accountRecordZERO && ( pagination && pagination.current == 1 ) && <>
          {RenderAccountRecord(accountRecordZERO)}
        </>
      }
      <List
        dataSource={accountRecords}
        renderItem={RenderAccountRecord}
        pagination={pagination}
        loading={loading}
      />
    </Card>

    <WalletWithdrawModal selectedAccountRecord={selectedAccountRecord}
      openWithdrawModal={openWithdrawModal} setOpenWithdrawModal={setOpenWithdrawModal} />

  </>



}
