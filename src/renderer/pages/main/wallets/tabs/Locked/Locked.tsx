import { Row, Statistic, Card, Col, Typography, Button, Divider, Space, Tag, List, Input, Select, Radio, Alert } from "antd";
import { useSafe4Balance, useWalletsActiveAccount } from "../../../../../state/wallets/hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockNumber, useTimestamp } from "../../../../../state/application/hooks";
import { useAccountManagerContract, useBatchLockOneCentContract, useBatchLockTenCentsContract, useMulticallContract } from "../../../../../hooks/useContracts";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../../../structs/AccountManager";
import WalletWithdrawModal from "../../Withdraw/WalletWithdrawModal";
import { SystemContract } from "../../../../../constants/SystemContracts";
import AddLockModal from "./AddLockModal";
import { useTranslation } from "react-i18next";
import AccountRecordRender, { AccountRecordRenderType } from "./AccountRecordRender";
import useSupernodeAddresses from "../../../../../hooks/useSupernodeAddresses";
import Checkbox, { CheckboxGroupProps } from "antd/es/checkbox";
import BatchWithdrawModal from "../../Withdraw/BatchWithdrawModal";
import { ZERO } from "../../../../../utils/CurrentAmountUtils";

const { Text } = Typography;

export enum LockContractType {
  Normal = 'normal',
  TEN_CENTS = 'ten_cents',
  ONE_CENT = 'one_cent'
}
export enum FilterType {
  All = 'All',
  Available = "Available"
}

export default () => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const safe4balance = useSafe4Balance([activeAccount])[activeAccount];
  const blockNumber = useBlockNumber();
  const supernodeAddresses = useSupernodeAddresses();
  const timestamp = useTimestamp();

  const _accountManagerContract = useAccountManagerContract();
  const batchLockContract_tencents = useBatchLockTenCentsContract();
  const batchLockContract_onecent = useBatchLockOneCentContract();
  const [lockType, setLockType] = useState<LockContractType>(LockContractType.Normal);
  const [filterType, setFilterType] = useState<FilterType>(FilterType.All);
  const AccountRecords_Page_Size = 20;
  const [accountRecords, setAccountRecords] = useState<AccountRecord[]>([]);
  const multicallContract = useMulticallContract();
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    onChange?: (page: number, pageSize: number) => void,
    pageSizeOptions: number[],
  }>();


  const accountManagerContract = useMemo(() => {
    if (!(_accountManagerContract && batchLockContract_tencents && batchLockContract_onecent)) return undefined;
    switch (lockType) {
      case LockContractType.Normal:
        return _accountManagerContract;
      case LockContractType.TEN_CENTS:
        return batchLockContract_tencents;
      case LockContractType.ONE_CENT:
        return batchLockContract_onecent;
    }
  }, [lockType, _accountManagerContract, batchLockContract_tencents, batchLockContract_onecent]);

  const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [selectedAccountRecord, setSelectedAccountRecord] = useState<AccountRecord>();
  const [accountRecordZERO, setAccountRecordZERO] = useState<AccountRecord>();
  const [queryAccountRecordId, setQueryAccountRecordId] = useState<number>();
  const [checkedAccountRecordIds, setCheckedAccountRecordIds] = useState<number[]>([]);

  const initilizePageQuery = useCallback(() => {
    if (accountManagerContract) {
      if (!queryAccountRecordId) {
        // function getTotalAmount(address _addr) external view returns (uint, uint);
        // function getAvailableAmount(address _addr) external view returns (uint, uint);
        const query = filterType == FilterType.All ? accountManagerContract.callStatic.getTotalAmount(activeAccount)
          : accountManagerContract.callStatic.getAvailableAmount(activeAccount);
        query.then((data: any) => {
          const _pagination = {
            total: data[1].toNumber(),
            pageSize: pagination?.pageSize ?? AccountRecords_Page_Size,
            position: "bottom",
            current: 1,
            pageSizeOptions: [20, 60, 100],
            onChange: (page: number, pageSize: number) => {
              _pagination.current = page;
              _pagination.pageSize = pageSize;
              setPagination({
                ..._pagination
              });
              setCheckedAccountRecordIds([]);
            }
          }
          setPagination({
            ..._pagination,
          })
        })
      } else {
        console.log("AccountRecord Id - Query initilizePageQuery");
        setPagination({
          total: 1,
          pageSize: AccountRecords_Page_Size,
          pageSizeOptions: [20, 60, 100],
          current: 1,
        })
      }
    }
  }, [pagination, accountManagerContract, queryAccountRecordId, filterType]);

  const multicallGetAccountRecordByIds = useCallback((_accountRecordIds: any) => {
    if (multicallContract && accountManagerContract) {

      const accountRecordIds = _accountRecordIds.map((_id: any) => _id.toNumber ? _id.toNumber() : _id)
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
      const calls = accountManagerContract.address == SystemContract.AccountManager ? getRecordByIDCalls.concat(getRecordUseInfoCalls) : getRecordByIDCalls;

      multicallContract.callStatic.aggregate(calls)
        .then(data => {
          const raws = data[1];
          const half = accountManagerContract.address == SystemContract.AccountManager ? raws.length / 2 : raws.length;
          for (let i = half - 1; i >= 0; i--) {
            const _accountRecord = accountManagerContract?.interface.decodeFunctionResult(getRecordByIDFragment, raws[i])[0];
            const accountRecord = formatAccountRecord(_accountRecord);
            accountRecord.contractAddress = accountManagerContract.address;

            if (accountManagerContract.address == SystemContract.AccountManager) {
              const _recordUseInfo = accountManagerContract?.interface.decodeFunctionResult(getRecordUseInfoFragment, raws[half + i])[0];
              accountRecord.recordUseInfo = formatRecordUseInfo(_recordUseInfo);
            }
            if (accountRecord.addr == activeAccount) {
              accountRecords.push(accountRecord);
            }
          }
          setLoading(false);
          setAccountRecords(accountRecords);
        })
    }
  }, [multicallContract, accountManagerContract, pagination]);

  useEffect(() => {
    if (accountManagerContract) {
      // function getRecord0(address _addr) external view returns (AccountRecord memory);
      accountManagerContract.callStatic.getRecord0(activeAccount)
        .then(_accountRecord => {
          const accountRecordZERO = formatAccountRecord(_accountRecord);
          setAccountRecordZERO(accountRecordZERO)
        })
        .catch((err: any) => {
        })
    }
  }, [accountManagerContract, blockNumber, activeAccount]);

  useEffect(() => {
    if (pagination && pagination.current != 1) {
      // 如果已经刷新过数据且不是第一页的情况下,不自动刷新数据.
      return;
    }
    initilizePageQuery();
  }, [blockNumber]);
  useEffect(() => {
    initilizePageQuery();
  }, [accountManagerContract, activeAccount, queryAccountRecordId, filterType]);

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
        // function getAvailableIDs(address _addr, uint _start, uint _count) external view returns (uint[] memory);
        setLoading(true);
        if (!queryAccountRecordId) {
          const query = filterType == FilterType.All ? accountManagerContract.getTotalIDs(activeAccount, position, offset) :
            accountManagerContract.getAvailableIDs(activeAccount, position, offset);
          query.then((accountRecordIds: any) => {
            multicallGetAccountRecordByIds(accountRecordIds);
          })
        } else {
          multicallGetAccountRecordByIds([queryAccountRecordId]);
        }
      } else {
        setAccountRecords([]);
      }
    }
  }, [pagination]);

  const RenderAccountRecord = useCallback((accountRecord: AccountRecord) => {
    return <List.Item>
      {
        AccountRecordRender({
          accountRecord, renderType: AccountRecordRenderType.Simple, blockNumber, timestamp, t, supernodeAddresses,
          checkedAccountRecordIds: FilterType.Available == filterType ? checkedAccountRecordIds : undefined,
          actions: {
            addLockDay: (accountRecord) => {
              setSelectedAccountRecord(accountRecord);
              setOpenAddModal(true)
            },
            withdraw: (accountRecord) => {
              setSelectedAccountRecord(accountRecord);
              setOpenWithdrawModal(true)
            },
            checked: (accountRecord) => {
              if (checkedAccountRecordIds.includes(accountRecord.id)) {
                setCheckedAccountRecordIds(checkedAccountRecordIds.filter(id => id !== accountRecord.id));
              } else {
                checkedAccountRecordIds.push(accountRecord.id);
                setCheckedAccountRecordIds([...checkedAccountRecordIds]);
              }
            }
          }
        })
      }
    </List.Item>
  }, [blockNumber, timestamp, lockType, filterType, checkedAccountRecordIds, supernodeAddresses]);

  const options: CheckboxGroupProps<string>['options'] = [
    { label: '全部', value: FilterType.All },
    { label: '仅显示可提现', value: FilterType.Available },
  ];

  const [openBatchWithdrawModal, setOpenBatchWithdrawModal] = useState<boolean>(false);
  const checkedAccountRecords = useMemo(() => {
    return accountRecords && accountRecords.filter(accountRecord => checkedAccountRecordIds.indexOf(accountRecord.id) >= 0);
  }, [accountRecords, checkedAccountRecordIds]);
  const [selectedAccountRecords, setSelectedAccountRecords] = useState<AccountRecord[] | undefined>(undefined);

  return <>
    <Row>
      <Col span={18}>
        <Statistic title={t("wallet_balanceOfAccountManager")} value={safe4balance?.total?.amount?.toFixed(6)} />
      </Col>
      <Col span={6}>
        <Row>
          {/** 提现全部按钮 */}
          {/* <Col offset={18} span={6} style={{ textAlign: "center" }}>
            <Button style={{
              height: "45px", width: "45px"
            }} size='large' shape="circle" icon={<RetweetOutlined />} onClick={() => {
              setSelectedAccountRecord(undefined);
              setOpenWithdrawModal(true)
            }
            } /><br />
            <Text>{t("wallet_withdraw")}</Text>
          </Col> */}
        </Row>
      </Col>
    </Row>
    <Row style={{ marginTop: "50px" }}>
      <Col span={8}>
        <Statistic title={t("wallet_accountManager_avaiable")} value={safe4balance?.avaiable?.amount?.toFixed(6)} />
      </Col>
      <Col span={8}>
        <Statistic title={t("wallet_accountManager_locked")} value={safe4balance?.locked?.amount?.toFixed(6)} />
      </Col>
      <Col span={8}>
        <Statistic title={t("wallet_accountManager_freeze")} value={safe4balance?.used?.amount?.toFixed(6)} />
      </Col>
    </Row>

    <Card title={<>
      <Space>
        <Select
          defaultValue={lockType}
          style={{ width: 200 }}
          onChange={(value) => {
            setLockType(value);
            setAccountRecords([]);
          }}
          options={[
            {
              label: <span>普通锁仓</span>,
              options: [
                { label: <span>锁仓列表</span>, value: LockContractType.Normal },
              ],
            },
            {
              label: <span>小额锁仓</span>,
              title: '小额锁仓',
              options: [
                { label: <span>[0.1 ~ 1)</span>, value: LockContractType.TEN_CENTS },
                { label: <span>[0.01 ~ 0.1)</span>, value: LockContractType.ONE_CENT },
              ],
            },
          ]} />
        <Radio.Group
          options={options}
          value={filterType}
          optionType="button"
          buttonStyle="solid"
          onChange={(event) => {
            setFilterType(event.target.value);
            setAccountRecords([]);
          }}
        />
      </Space>

    </>} style={{ marginTop: "40px" }}>
      <Row>
        <Col span={filterType == FilterType.Available ? 12 : 24}>
          <Input.Search size="large" placeholder={t("wallet_locked_placehold_inputAccountRecordId")} onChange={(event) => {
            if (!event.target.value.trim()) {
              setQueryAccountRecordId(undefined);
            }
          }} onSearch={(value) => {
            const id = Number(value);
            if (id) {
              setQueryAccountRecordId(id);
            } else {

            }
          }} />
        </Col>
        <Col span={filterType == FilterType.Available ? 12 : 0} style={{ textAlign: "right" }}>
          <Checkbox checked={accountRecords.length > 0 && checkedAccountRecordIds.length == accountRecords.length}
            indeterminate={checkedAccountRecordIds.length > 0 && checkedAccountRecordIds.length != accountRecords.length} onClick={() => {
              if (checkedAccountRecordIds.length == accountRecords.length) {
                setCheckedAccountRecordIds([]);
              } else {
                setCheckedAccountRecordIds(
                  accountRecords.map(accountRecord => accountRecord.id)
                )
              }
            }} />
          <Text>勾选所有</Text><Divider type="vertical" />
          <Button disabled={checkedAccountRecords.length == 0} onClick={() => {
            setSelectedAccountRecords(checkedAccountRecords);
            setOpenBatchWithdrawModal(true);
          }}>
            批量提现
          </Button>
        </Col>
      </Row>
      {
        accountRecordZERO && (pagination && pagination.current == 1) && !queryAccountRecordId
        && lockType == LockContractType.Normal && filterType == FilterType.All && <>
          <Alert style={{ marginTop: "20px" }} type="info" message={<>
            <Row>
              <Col span={20}>
                <Text strong>挖矿奖励:
                  {accountRecordZERO?.amount.toFixed(6)} SAFE
                </Text>
                <br />
                <Text type="secondary">
                  通过创建超级节点以及主节点来参与 SAFE4 网络治理,对超级节点进行投票,获取挖矿奖励.您可以随时从锁仓账户中提现当前累计的奖励.
                </Text>
              </Col>
              <Col span={4}>
                <Button disabled={!accountRecordZERO.amount.greaterThan(ZERO)} type="primary" style={{ float: "right", marginTop: "5px" }}
                  onClick={() => {
                    setSelectedAccountRecord(accountRecordZERO);
                    setOpenWithdrawModal(true);
                  }}>
                  提现
                </Button>
              </Col>
            </Row>
          </>}></Alert>
        </>
      }

      <List
        dataSource={accountRecords}
        renderItem={RenderAccountRecord}
        pagination={pagination}
        loading={loading}
        grid={lockType == LockContractType.Normal ? { gutter: 16, column: 4 } : { gutter: 16, column: 4 }}
      />
    </Card >

    <AddLockModal selectedAccountRecord={selectedAccountRecord}
      openAddModal={openAddModal} setOpenAddModal={setOpenAddModal} />

    {
      accountManagerContract && selectedAccountRecord &&
      <WalletWithdrawModal selectedAccountRecord={selectedAccountRecord} accountManagerContract={accountManagerContract}
        openWithdrawModal={openWithdrawModal} setOpenWithdrawModal={setOpenWithdrawModal} />
    }
    {
      accountManagerContract && selectedAccountRecords &&
      <BatchWithdrawModal accountRecords={selectedAccountRecords} accountManagerContract={accountManagerContract}
        openBatchWithdrawModal={openBatchWithdrawModal} setOpenBatchWithdrawModal={setOpenBatchWithdrawModal} />
    }
  </>

}
