import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Alert, Pagination, Spin, List } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { SupernodeInfo, formatSupernodeInfo } from '../../../../structs/Supernode';
import VoteModalConfirm from './VoteModal-Confirm';
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from '../../../../structs/AccountManager';
import { CurrencyAmount } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { useBlockNumber, useTimestamp } from '../../../../state/application/hooks';
import useAddrNodeInfo from '../../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';
import useAccountRecords from '../../../../hooks/useAccountRecords';
import AccountRecordRender, { AccountRecordRenderType } from '../../wallets/tabs/Locked/AccountRecordRender';
import { EmptyContract } from '../../../../constants/SystemContracts';
import { ZERO } from '../../../../utils/CurrentAmountUtils';

const { Text } = Typography;
const ONE = CurrencyAmount.ether(ethers.utils.parseEther("1").toBigInt());

export default ({
  supernodeInfo, supernodeAddresses
}: {
  supernodeInfo?: SupernodeInfo,
  supernodeAddresses: string[]
}) => {
  const { t } = useTranslation();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();
  const timestamp = useTimestamp();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);
  const [currentPageAccountRecords, setCurrentPageAccountRecords] = useState<AccountRecord[]>([]);
  const [checkedAccountRecords, setCheckedAccountRecords] = useState<AccountRecord[]>([]);
  const checkedAccountRecordIds = checkedAccountRecords.map(ar => ar.id);
  const { result, Render } = useAccountRecords();
  const [activeAccountAccountRecords, setActiveAccountRecords] = useState<AccountRecord[] | undefined>(undefined);
  const [openVoteModal, setOpenVoteModal] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    pageSizeOptions: number[],
    onChange?: (page: number, pageSize: number) => void
  }>({
    total: undefined,
    pageSize: 40,
    current: 1,
    pageSizeOptions: [40, 60, 100],
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
          const noVote = accountRecord.recordUseInfo.votedAddr == EmptyContract.EMPTY;
          const greaterEqThanOne = !ONE.greaterThan(accountRecord.amount);
          const noJoinSN = !supernodeAddresses.includes(accountRecord.recordUseInfo?.frozenAddr);
          return noVote
            && greaterEqThanOne
            && noJoinSN;
        }).sort((ar0, ar1) => {
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
  }, [result, activeAccount, supernodeAddresses]);

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

  return <>
    <Card title={<>
      {t("wallet_supernodes_votes_locked_title")}
      <span style={{ float: "right" }}>{Render()}</span>
    </>} style={{ width: "100%" }}>
      <>
        <Checkbox
          checked={currentPageAccountRecords.length > 0 && currentPageAccountRecords.length == checkedAccountRecords.length}
          indeterminate={checkedAccountRecords.length > 0 && checkedAccountRecords.length != currentPageAccountRecords.length}
          onChange={(event) => {
            const checkAll = event.target.checked;
            if (checkAll) {
              setCheckedAccountRecords([...currentPageAccountRecords]);
            } else {
              setCheckedAccountRecords([]);
            }
          }}>
          选择全部可用锁仓记录   {checkedAccountRecordIds.length > 0 && RenderCheckedResult()}
        </Checkbox>
        <Alert style={{ marginTop: "20px" }} type='info' showIcon message={
          <>
            <Text>{t("wallet_supernodes_votes_locked_tips")}</Text><br />
            <Text>1. {t("wallet_supernodes_votes_locked_tip0")}</Text><br />
            <Text>2. {t("wallet_supernodes_votes_locked_tip1")}</Text><br />
            <Text>3. {t("wallet_supernodes_votes_locked_tip2")} <Text strong>1 SAFE</Text></Text><br />
          </>
        } />
        <Divider />
        <List
          dataSource={activeAccountAccountRecords}
          renderItem={RenderAccountRecord}
          pagination={pagination}
          grid={{ gutter: 16, column: 5 }}
        />
        <br />
        <Divider />
        <Spin spinning={activeAccountNodeInfo == undefined}>
          <Button type='primary' disabled={(activeAccountNodeInfo && activeAccountNodeInfo.isSN) || checkedAccountRecords.length == 0} onClick={() => {
            if (activeAccountAccountRecords) {
              setOpenVoteModal(true)
              setCheckedAccountRecords(checkedAccountRecords);
            }
          }}>
            {t("vote")}
          </Button>
          {
            activeAccountNodeInfo && activeAccountNodeInfo.isSN &&
            <Alert style={{ marginTop: "5px" }} showIcon type="warning" message={<>
              超级节点不能进行投票
            </>} />
          }
        </Spin>
      </>
    </Card>
    {
      supernodeInfo && <VoteModalConfirm openVoteModal={openVoteModal} setOpenVoteModal={setOpenVoteModal}
        supernodeInfo={supernodeInfo} accountRecords={checkedAccountRecords} />
    }
  </>

}
