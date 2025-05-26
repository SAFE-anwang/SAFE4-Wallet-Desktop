import { useCallback, useEffect, useMemo, useState } from "react"
import { SupernodeInfo } from "../../../../structs/Supernode";
import { useWalletsActiveAccount } from "../../../../state/wallets/hooks";
import { useAccountManagerContract, useMulticallContract, useSupernodeVoteContract } from "../../../../hooks/useContracts";
import { Alert, Checkbox, CheckboxProps, Col, Divider, GetProp, Pagination, Row, Spin, Tooltip, Typography } from "antd";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../../../structs/AccountManager";
import { useTranslation } from "react-i18next";
import { useBlockNumber } from "../../../../state/application/hooks";
import { ClusterOutlined } from "@ant-design/icons";

const AccountRecords_Page_Size = 25;

const { Text } = Typography;

export default ({
  supernodeInfo, selectAccountRecordIdCallback, usedVotedIdsCache
}: {
  supernodeInfo: SupernodeInfo,
  selectAccountRecordIdCallback: (checkedAccountRecordIds: number[]) => void,
  usedVotedIdsCache: number[]
}) => {

  const activeAccount = useWalletsActiveAccount();
  const supernodeVoteContract = useSupernodeVoteContract();
  const multicallContract = useMulticallContract();
  const accountManagerContract = useAccountManagerContract();
  const { t } = useTranslation();
  const blockNumber = useBlockNumber();
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    total: number | undefined
    pageSize: number | undefined,
    current: number | undefined,
    onChange?: (page: number) => void
  }>();
  const [activeAccountAccountRecords, setActiveAccountRecords] = useState<AccountRecord[]>();
  const [checkedAccountRecordIds, setCheckedAccountRecordIds] = useState<any[]>([]);

  const initilizePageQuery = useCallback(() => {
    if (supernodeVoteContract && activeAccount) {
      // function getTotalAmount(address _addr) external view returns (uint, uint);
      supernodeVoteContract.callStatic.getVotedIDNum4Voter(activeAccount)
        .then((data: any) => {
          const pagination = {
            total: data.toNumber(),
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
  }, [supernodeVoteContract, activeAccount]);

  useEffect(() => {
    initilizePageQuery();
  }, [supernodeVoteContract, activeAccount]);

  useEffect(() => {
    if (pagination && supernodeVoteContract && multicallContract) {
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
        // function getVotedIDs4Voter(address _voterAddr, uint _start, uint _count) public view override returns (uint[] memory) ;
        setLoading(true);
        setCheckedAccountRecordIds([]);
        supernodeVoteContract.getVotedIDs4Voter(activeAccount, position, offset)
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
          setLoading(false);
        })
    }
  }, [multicallContract, accountManagerContract, pagination]);

  const {
    optionsAllAccountRecords, votableAccountRecordIds
  } = useMemo(() => {
    if (activeAccountAccountRecords && activeAccountAccountRecords.length > 0) {
      activeAccountAccountRecords.sort((ar1, ar2) => ar2.id - ar1.id)
      const optionsAllAccountRecords = activeAccountAccountRecords.filter(accountRecord => accountRecord.recordUseInfo)
        .map(accountRecord => {
          // 过滤条件，必须是老超级节点的投票，并且必须达到 releaseHeight , 以及使用缓存中没用它.
          const disabled = (accountRecord.recordUseInfo?.votedAddr != supernodeInfo.addr
            || blockNumber <= accountRecord.recordUseInfo.releaseHeight)
            || usedVotedIdsCache.indexOf(accountRecord.id) >= 0;
          // const disabled = usedVotedIdsCache.indexOf(accountRecord.id) >= 0;
          return {
            label: <>
              <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
                <Row>
                  <Col>{t("wallet_locked_accountRecordLockId")}:</Col>
                  <Col>{accountRecord.id}</Col>
                </Row>
                <Row style={{ fontSize: "12px" }}>
                  {
                    supernodeInfo.addr == accountRecord.recordUseInfo?.votedAddr && <ClusterOutlined />
                  }
                  {accountRecord.amount.toFixed(2)} SAFE
                </Row>
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
  }, [activeAccountAccountRecords, blockNumber, usedVotedIdsCache]);


  // 勾选单个记录时触发
  const onAccountRecordCheckChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
    setCheckedAccountRecordIds(checkedValues);
  };
  // 勾选全部
  const onAccountRecordCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedAccountRecordIds(e.target.checked ? votableAccountRecordIds : []);
  };
  const indeterminate = checkedAccountRecordIds.length > 0 && checkedAccountRecordIds.length < votableAccountRecordIds.length;
  const checkAll = votableAccountRecordIds.length === checkedAccountRecordIds.length;

  useEffect(() => {
    selectAccountRecordIdCallback(checkedAccountRecordIds.filter(id => usedVotedIdsCache.indexOf(id) < 0));
  }, [checkedAccountRecordIds, usedVotedIdsCache])

  return <>
    <Spin spinning={loading}>
      <Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onAccountRecordCheckAllChange}>
        选择全部可用锁仓记录
      </Checkbox>
      <Alert style={{ marginTop: "20px" }} type='info' showIcon message={
        <>
          <Text>必须同时满足如下条件的投票锁仓记录才能进行转投</Text><br />
          <Text>1. 投票给当前 <Text type="secondary" strong>超级节点ID:{supernodeInfo.id}<Divider type="vertical"/>{supernodeInfo.name}</Text> 的锁仓</Text><br />
          <Text>2. 满足质押时间才可以进行转投</Text><br />
        </>
      } />
      <Divider />
      <Checkbox.Group
        options={optionsAllAccountRecords}
        onChange={onAccountRecordCheckChange}
        value={checkedAccountRecordIds}
      />
      <br /><br />
      <Pagination style={{ float: "right" }} {...pagination}></Pagination>
      <br /><br />
    </Spin>
  </>

}
