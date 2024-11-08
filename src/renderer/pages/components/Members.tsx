import { Button, Table, Tooltip, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { MemberInfo } from "../../structs/Supernode"
import AddressComponent from "./AddressComponent";
import { useTranslation } from "react-i18next";
import { useAccountManagerContract, useMulticallContract } from "../../hooks/useContracts";
import { useEffect, useState } from "react";
import { AccountRecord, formatAccountRecord, formatRecordUseInfo } from "../../structs/AccountManager";
import { useBlockNumber, useTimestamp } from "../../state/application/hooks";
import { DateTimeFormat } from "../../utils/DateUtils";
import { LockOutlined, UnlockOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useWalletsActiveAccount } from "../../state/wallets/hooks";
import AddLockModal from "../main/wallets/tabs/Locked/AddLockModal";

const { Text } = Typography;

export default ({
  memberInfos
}: {
  memberInfos: MemberInfo[]
}) => {
  const { t } = useTranslation();
  const timestamp = useTimestamp();
  const blockNumber = useBlockNumber();
  const multicallContract = useMulticallContract();
  const accountManagerContract = useAccountManagerContract();
  const [_memberInfos, setMemberInfos] = useState<MemberInfo[]>();
  const activeAccount = useWalletsActiveAccount();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedAccountRecord, setSelectedAccountRecord] = useState<AccountRecord>();

  const columns: ColumnsType<MemberInfo> = [
    {
      title: t("wallet_locked_accountRecordLockId"),
      dataIndex: 'lockID',
      key: 'lockID',
      render: (lockID, memberInfo) => {
        let unlockHeight = memberInfo.accountRecord?.unlockHeight;
        let locked = true;
        let unlockDateTime = undefined;
        if (unlockHeight) {
          locked = unlockHeight > blockNumber;
          unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
        }
        return <>
          {
            locked && <LockOutlined />
          }
          {
            !locked && <UnlockOutlined />
          }
          <Text strong style={{ marginLeft: "5px" }}>{lockID}</Text>
        </>
      }
    },
    {
      title: t("wallet_locked_unlockHeight"),
      dataIndex: 'lockID',
      key: 'unlockHeight',
      render: (_, memberInfo) => {
        let locked = true;
        let unlockDateTime = undefined;
        let unlockHeight = memberInfo.accountRecord?.unlockHeight;
        if (unlockHeight) {
          locked = unlockHeight > blockNumber;
          unlockDateTime = unlockHeight - blockNumber > 0 ? DateTimeFormat(((unlockHeight - blockNumber) * 30 + timestamp) * 1000) : undefined;
        }
        return <Text strong type={locked ? "secondary" : "warning"}>
          {
            unlockDateTime &&
            <Tooltip title={unlockHeight}>
              <Text strong style={{ float: "left" }} type="secondary">
                {unlockDateTime}
              </Text>
            </Tooltip>
          }
          {
            !unlockDateTime && <Text type="warning">{unlockHeight}</Text>
          }
          {
            activeAccount == memberInfo.addr &&
            <Button onClick={() => {
              setSelectedAccountRecord(memberInfo.accountRecord);
              setOpenAddModal(true);
            }} title={t("wallet_locked_addLockDay")} icon={<ClockCircleOutlined />} style={{ float: "right" }} size="small">{t("wallet_locked_addLockDay")}</Button>
          }
        </Text>
      }
    },
    {
      title: t("address"),
      dataIndex: 'addr',
      key: 'addr',
      render: (addr) => {
        return <>
          <div style={{ width: "100%" }}>
            <AddressComponent address={addr} ellipsis copyable qrcode />
          </div>
        </>
      }
    },
    {
      title: t("stake"),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => {
        return <Text strong>{amount.toFixed(6)} SAFE</Text>
      }
    },
  ];

  useEffect(() => {
    setMemberInfos(memberInfos);
    if (multicallContract && accountManagerContract) {
      const getRecordByIDFragment = accountManagerContract.interface.getFunction("getRecordByID");
      const getRecordUseInfoFragment = accountManagerContract?.interface?.getFunction("getRecordUseInfo");
      const getRecordByIDCalls = [];
      const getRecordUseInfoCalls = [];
      for (let i = 0; i < memberInfos.length; i++) {
        getRecordByIDCalls.push([
          accountManagerContract.address,
          accountManagerContract?.interface.encodeFunctionData(getRecordByIDFragment, [memberInfos[i].lockID])
        ]);
        getRecordUseInfoCalls.push([
          accountManagerContract.address,
          accountManagerContract?.interface.encodeFunctionData(getRecordUseInfoFragment, [memberInfos[i].lockID])
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
          accountRecords.forEach(accountRecord => {
            memberInfos.forEach(memberInfo => {
              if (memberInfo.lockID == accountRecord.id) {
                memberInfo.accountRecord = accountRecord;
              }
            });
          })
          setMemberInfos([...memberInfos]);
        });
    }
  }, [memberInfos, multicallContract, accountManagerContract])

  return <>
    <Table dataSource={_memberInfos} columns={columns} />
    <AddLockModal selectedAccountRecord={selectedAccountRecord}
      openAddModal={openAddModal} setOpenAddModal={setOpenAddModal} />
  </>
}
