
import { Typography, Row, Col, Button, Card, Checkbox, CheckboxProps, Divider, Alert } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { CheckboxValueType } from 'antd/es/checkbox/Group';
import type { GetProp } from 'antd';
import { useActiveAccountAccountRecords } from '../../../../state/wallets/hooks';
import { EmptyContract } from '../../../../constants/SystemContracts';
import { useSelector } from 'react-redux';
import { AppState } from '../../../../state';
import { useSupernodeStorageContract } from '../../../../hooks/useContracts';
import { SupernodeInfo, formatSupernodeInfo } from '../../../../structs/Supernode';
import VoteModalConfirm from './VoteModal-Confirm';
import { AccountRecord } from '../../../../structs/AccountManager';
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Supernode from '../Supernode';
import { CurrencyAmount } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { fetchSuperNodeAddresses } from '../../../../services/supernode';

const { Text , Title } = Typography;

export default () => {

  const supernodeAddr = useSelector<AppState, string | undefined>(state => state.application.control.vote);
  const [supernodeAddresses,setSupernodeAddresses] = useState<string[]>([]);
  const activeAccountAccountRecords = useActiveAccountAccountRecords();
  const supernodeStorageContract = useSupernodeStorageContract();
  const navigate = useNavigate();

  const [supernodeInfo, setSupernodeInfo] = useState<SupernodeInfo>();
  useEffect(() => {
    if (supernodeAddr && supernodeStorageContract) {
      // function getInfo(address _addr) external view returns (SuperNodeInfo memory);
      supernodeStorageContract.callStatic.getInfo(supernodeAddr)
        .then(_supernodeInfo => setSupernodeInfo(formatSupernodeInfo(_supernodeInfo)))
        .catch(err => {

        })
    }
  }, [supernodeAddr]);

  useEffect(()=>{
    fetchSuperNodeAddresses()
    .then( setSupernodeAddresses )
  },[]);

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
                              ||  ONE.greaterThan(accountRecord.amount) ;
          return {
            label: <>
              <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
                <Row>
                  <Col>锁仓记录ID:</Col>
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
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Button style={{ marginTop: "18px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/supernodes")
        }} />
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          超级节点投票
        </Title>
      </Col>
    </Row>

    <div style={{ width: "100%", paddingTop: "40px", minWidth: "1000px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Row>
          <Card title="选择锁仓记录对超级节点进行投票" style={{ width: "100%" }}>
            <>
              <Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onAccountRecordCheckAllChange}>
                选择全部可用锁仓记录
              </Checkbox>
              <Alert style={{marginTop:"20px"}} type='info' showIcon message={
                <>
                  <Text>必须同时满足如下条件的锁仓记录才可以进行投票</Text><br />
                  <Text>1. 未关联超级节点的锁仓记录</Text><br />
                  <Text>2. 未投票的锁仓记录</Text><br />
                  <Text>3. 锁仓数量大于 <Text strong>1 SAFE</Text></Text><br />
                </>
              } />
              <Divider />
              <Checkbox.Group
                options={optionsAllAccountRecords}
                onChange={onAccountRecordCheckChange}
                value={checkedAccountRecordIds}
              />
              <Divider />
              <Button type='primary' disabled={checkedAccountRecordIds.length == 0} onClick={() => {
                const checkedAccountRecords = activeAccountAccountRecords.filter(accountRecord => checkedAccountRecordIds.indexOf(accountRecord.id) >= 0);
                setOpenVoteModal(true)
                setCheckedAccountRecords(checkedAccountRecords);
              }}>
                投票
              </Button>
            </>
          </Card>
        </Row>

        <Row>
          {
            supernodeInfo && <Supernode supernodeInfo={supernodeInfo} />
          }
        </Row>

      </div>
    </div>

    {
      supernodeInfo && <VoteModalConfirm openVoteModal={openVoteModal} setOpenVoteModal={setOpenVoteModal}
        supernodeInfo={supernodeInfo} accountRecords={checkedAccountRecords} />
    }
  </>

}
