import { useCallback, useEffect, useMemo, useState } from "react"
import { SupernodeInfo } from "../../../../structs/Supernode";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { Alert, Card, Checkbox, CheckboxProps, Col, Divider, GetProp, List, Pagination, Row, Spin, Tooltip, Typography } from "antd";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../../structs/AccountManager";
import { useTranslation } from "react-i18next";
import { useBlockNumber, useTimestamp } from "../../../../state/application/hooks";
import useAccountRecords, { AccountRecordUseType } from "../../../../hooks/useAccountRecords";
import AccountRecordRender, { AccountRecordRenderType } from "../../wallets/tabs/Locked/AccountRecordRender";
import useSupernodeAddresses from "../../../../hooks/useSupernodeAddresses";
import { ZERO } from "../../../../utils/CurrentAmountUtils";

const { Text } = Typography;

export default ({
  supernodeInfo, selectAccountRecordIdCallback, usedVotedIdsCache
}: {
  supernodeInfo: SupernodeInfo,
  selectAccountRecordIdCallback: (checkedAccountRecordIds: number[]) => void,
  usedVotedIdsCache: number[]
}) => {

  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const [currentPageAccountRecords, setCurrentPageAccountRecords] = useState<AccountRecord[]>([]);
  const [checkedAccountRecords, setCheckedAccountRecords] = useState<AccountRecord[]>([]);
  const checkedAccountRecordIds = checkedAccountRecords.map(ar => ar.id);
  const [activeAccountAccountRecords, setActiveAccountRecords] = useState<AccountRecord[] | undefined>(undefined);
  const { result, Render } = useAccountRecords({ type: AccountRecordUseType.Voted });
  const supernodeAddresses = useSupernodeAddresses();
  const disabledAccountRecordIds = currentPageAccountRecords.filter(accountRecord => accountRecord.recordUseInfo && accountRecord.recordUseInfo.releaseHeight > blockNumber)
    .map(accountRecord => accountRecord.id);

  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    pageSizeOptions: number[] | undefined,
    showSizeChanger: false | undefined,
    onChange?: (page: number, pageSize: number) => void
  }>({
    total: undefined,
    pageSize: 20,
    current: 1,
    pageSizeOptions: [],
    showSizeChanger: false,
    onChange: (page, pageSize) => {
      setCheckedAccountRecords([]);
      setPagination(prev => {
        return {
          ...prev,
          current: page,
          pageSize
        };
      })
    }
  });

  // 从 useAccountRecords 钩子中加载锁仓数据.
  useEffect(() => {
    if (result.activeAccount != activeAccount) {
      setActiveAccountRecords(undefined);
      setPagination({
        ...pagination,
        current: 1
      });
      setCheckedAccountRecords([]);
    } else {
      const accountRecords = result.accountRecords;
      const loading = result.loading;
      if (accountRecords) {
        const _activeAccountRecords = accountRecords.filter((accountRecord) => {
          if (!accountRecord.recordUseInfo) { return false };
          const inVotedCache = usedVotedIdsCache.includes(accountRecord.id);
          const isSupernodeVotes = supernodeInfo.addr == accountRecord.recordUseInfo.votedAddr;
          return !inVotedCache
            && isSupernodeVotes
        }).sort((ar0, ar1) => {
          if (ar0.recordUseInfo == undefined
            || ar1.recordUseInfo == undefined) {
            return 0;
          }
          if (ar0.recordUseInfo.releaseHeight !== ar1.recordUseInfo.releaseHeight) {
            return ar0.recordUseInfo?.releaseHeight - ar1.recordUseInfo.releaseHeight;
          }
          return ar1.startHeight - ar0.startHeight;
        });
        setActiveAccountRecords(prev => {
          if (prev == undefined || (accountRecords != undefined && !loading)) {
            console.log(prev != undefined ? "重置数据" : "加载数据");
            return _activeAccountRecords;
          }
          return prev;
        });
      }
    }
  }, [result, activeAccount, usedVotedIdsCache]);
  // 切片当前页的数据...
  useEffect(() => {
    const { current, pageSize } = pagination;
    if (activeAccountAccountRecords && current && pageSize) {
      const slicePageAccountRecords = activeAccountAccountRecords.slice(
        (current - 1) * pageSize, (current - 1) * pageSize + pageSize
      );
      setCurrentPageAccountRecords(slicePageAccountRecords);
      // 判断是否需要从勾选的ID中去除一些数据...
      const currentIds = slicePageAccountRecords.map(accountRecord => accountRecord.id);
      const removeIds: number[] = [];
      checkedAccountRecordIds.forEach(checkedId => {
        if (!currentIds.includes(checkedId)) {
          removeIds.push(checkedId);
        }
      });
      if (removeIds.length > 0) {
        const newChecked = [...checkedAccountRecords.filter(accountRecord => !removeIds.includes(accountRecord.id))];
        setCheckedAccountRecords(
          newChecked
        )
      }
    }
  }, [pagination, activeAccountAccountRecords]);

  const RenderAccountRecord = useCallback((accountRecord: AccountRecord) => {
    return <List.Item>
      {
        AccountRecordRender({
          accountRecord, renderType: AccountRecordRenderType.Small, blockNumber, timestamp, t, supernodeAddresses,
          checkedAccountRecordIds,
          disabledAccountRecordIds,
          actions: {
            checked: (accountRecord) => {
              if (checkedAccountRecordIds.includes(accountRecord.id)) {
                setCheckedAccountRecords(
                  [...checkedAccountRecords].filter(checkedAccountRecord => checkedAccountRecord.id !== accountRecord.id)
                )
              } else {
                const _checked = [...checkedAccountRecords];
                _checked.push(accountRecord);
                setCheckedAccountRecords(_checked)
              }
            }
          }
        })
      }
    </List.Item>
  }, [blockNumber, timestamp, supernodeAddresses, checkedAccountRecordIds]);

  const RenderCheckedResult = () => {
    const checkedSafeAmount = checkedAccountRecords.reduce((total, accountRecord) => {
      total = total.add(accountRecord.amount);
      return total;
    }, ZERO)
    return <>
      <Text strong>(已选 {checkedAccountRecordIds.length} 个锁仓记录</Text>
      <Divider type='vertical' />
      <Text strong>{checkedSafeAmount.toSignificant(4)} SAFE) </Text>
    </>
  }

  useEffect(() => {
    selectAccountRecordIdCallback(checkedAccountRecords.map(accountRecord => accountRecord.id));
  }, [checkedAccountRecords]);

  return <>
    <Card title={<>
      投票锁仓记录
      <span style={{ float: "right" }}>
        {Render()}
      </span>
    </>}>
      <Checkbox
        checked={currentPageAccountRecords.length > 0 && checkedAccountRecords.length > 0
          && currentPageAccountRecords.length - disabledAccountRecordIds.length == checkedAccountRecords.length}
        indeterminate={checkedAccountRecords.length > 0
          && checkedAccountRecords.length != currentPageAccountRecords.length - disabledAccountRecordIds.length}
        onChange={(event) => {
          const checkAll = event.target.checked;
          if (checkAll) {
            setCheckedAccountRecords([...currentPageAccountRecords.filter(
              accountRecord => !disabledAccountRecordIds.includes(accountRecord.id)
            )]);
          } else {
            setCheckedAccountRecords([]);
          }
        }}>
        选择全部可用锁仓记录   {checkedAccountRecordIds.length > 0 && RenderCheckedResult()}
      </Checkbox>
      <Alert style={{ marginTop: "20px" }} type='info' showIcon message={
        <>
          <Text>必须同时满足如下条件的投票锁仓记录才能进行转投</Text><br />
          <Text>1. 投票给当前 <Text type="secondary" strong>超级节点ID:{supernodeInfo.id}<Divider type="vertical" />{supernodeInfo.name}</Text> 的锁仓</Text><br />
          <Text>2. 满足质押时间才可以进行转投</Text><br />
        </>
      } />
      <Divider />
      <List
        dataSource={activeAccountAccountRecords}
        renderItem={RenderAccountRecord}
        pagination={pagination}
        grid={{ gutter: 16, column: 5 }}
      />
    </Card>
  </>

}
