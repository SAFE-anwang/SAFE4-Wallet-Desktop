import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Alert, Pagination, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords, useWalletsActiveAccount } from '../../../../state/wallets/hooks';
import { EmptyContract } from '../../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../../state';
import { useAccountManagerContract, useMulticallContract, useSupernodeStorageContract } from '../../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../../structs/Supernode';
import VoteModalConfirm from './VoteModal-Confirm';
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from '../../../../structs/AccountManager';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Supernode from '../Supernode';
import { CurrencyAmount } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { fetchSuperNodeAddresses } from '../../../../services/supernode';
import type { TabsProps } from 'antd';
import { useBlockNumber } from '../../../../state/application/hooks';
import useAddrNodeInfo from '../../../../hooks/useAddrIsNode';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const AccountRecords_Page_Size = 24;

export default ({
  supernodeInfo, supernodeAddresses
}: {
  supernodeInfo?: SupernodeInfo,
  supernodeAddresses: string[]
}) => {
  const { t } = useTranslation();
  const accountManagerContract = useAccountManagerContract();
  const activeAccount = useWalletsActiveAccount();
  const blockNumber = useBlockNumber();
  const multicallContract = useMulticallContract();
  const activeAccountNodeInfo = useAddrNodeInfo(activeAccount);

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
        accountManagerContract.getTotalIDs(activeAccount, position, offset)
          .then((accountRecordIds: any) => {
            multicallGetAccountRecordByIds(accountRecordIds);
          })
      } else {
        setActiveAccountRecords([]);
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
          setActiveAccountRecords(accountRecords);
        })
    }
  }, [multicallContract, accountManagerContract, pagination]);

  const [activeAccountAccountRecords, setActiveAccountRecords] = useState<AccountRecord[]>();

  const ONE = CurrencyAmount.ether(ethers.utils.parseEther("1").toBigInt());
  const {
    optionsAllAccountRecords, votableAccountRecordIds
  } = useMemo(() => {
    if (activeAccountAccountRecords && activeAccountAccountRecords.length > 0) {
      activeAccountAccountRecords.sort((ar1, ar2) => ar2.id - ar1.id)
      const optionsAllAccountRecords = activeAccountAccountRecords.filter(accountRecord => accountRecord.recordUseInfo)
        .map(accountRecord => {
          // 已经投过的不能再投，另外如果已经关联到超级节点的，也不能再参与投票了.
          const disabled = !(accountRecord.recordUseInfo?.votedAddr == EmptyContract.EMPTY)
            || supernodeAddresses.indexOf(accountRecord.recordUseInfo?.frozenAddr) >= 0
            || ONE.greaterThan(accountRecord.amount);
          return {
            label: <>
              <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
                <Row>
                  <Col>{t("wallet_locked_accountRecordLockId")}:</Col>
                  <Col>{accountRecord.id}</Col>
                </Row>
                <Row style={{ fontSize: "12px" }}>{accountRecord.amount.toFixed(2)} SAFE</Row>
              </div>
            </>,
            value: accountRecord.id,
            disabled
          }
        });
      const votableAccountRecordIds = optionsAllAccountRecords.filter(option => !option.disabled).map(option => option.value);
      return {
        optionsAllAccountRecords,
        votableAccountRecordIds
      }
    }
    return {
      optionsAllAccountRecords: [],
      votableAccountRecordIds: []
    }
  }, [activeAccountAccountRecords, supernodeAddresses]);
  const [checkedAccountRecordIds, setCheckedAccountRecordIds] = useState<CheckboxValueType[]>([]);
  const checkAll = votableAccountRecordIds.length === checkedAccountRecordIds.length;
  const indeterminate = checkedAccountRecordIds.length > 0 && checkedAccountRecordIds.length < votableAccountRecordIds.length;
  // 勾选全部
  const onAccountRecordCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedAccountRecordIds(e.target.checked ? votableAccountRecordIds : []);
  };
  // 勾选单个记录时触发
  const onAccountRecordCheckChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
    setCheckedAccountRecordIds(checkedValues);
  };
  const [openVoteModal, setOpenVoteModal] = useState<boolean>(false);
  const [checkedAccountRecords, setCheckedAccountRecords] = useState<AccountRecord[]>([]);

  return <>
    <Card title={t("wallet_supernodes_votes_locked_title")} style={{ width: "100%" }}>
      <>
        <Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onAccountRecordCheckAllChange}>
          选择全部可用锁仓记录
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
        <Checkbox.Group
          options={optionsAllAccountRecords}
          onChange={onAccountRecordCheckChange}
          value={checkedAccountRecordIds}
        />
        <br />
        <Pagination style={{ float: "right" }} {...pagination}></Pagination>
        <br />
        <Divider />
        <Spin spinning={activeAccountNodeInfo == undefined}>
          <Button type='primary' disabled={activeAccountNodeInfo && (checkedAccountRecordIds.length == 0 || activeAccountNodeInfo.isSN)} onClick={() => {
            if (activeAccountAccountRecords) {
              const checkedAccountRecords = activeAccountAccountRecords.filter(accountRecord => checkedAccountRecordIds.indexOf(accountRecord.id) >= 0);
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
