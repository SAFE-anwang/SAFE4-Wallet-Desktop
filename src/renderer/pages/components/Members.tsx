import { Button, Table, Tooltip, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { MemberInfo } from "../../structs/Supernode"
import AddressComponent from "./AddressComponent";
import { useTranslation } from "react-i18next";
import { useAccountManagerContract, useMulticallContract } from "../../hooks/useContracts";
import { useEffect, useState } from "react";
import { AccountRecord, formatAccountRecord } from "../../structs/AccountManager";
import { useBlockNumber, useTimestamp } from "../../state/application/hooks";
import { DateTimeFormat } from "../../utils/DateUtils";
import { LockOutlined, UnlockOutlined, ClockCircleOutlined } from "@ant-design/icons";

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
  const columns: ColumnsType<MemberInfo> = [
    {
      title: t("wallet_locked_accountRecordLockId"),
      dataIndex: 'lockID',
      key: 'lockID',
      render: (lockID, memberInfo) => {
        let unlockHeight = memberInfo.unlockHeight;
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
      dataIndex: 'unlockHeight',
      key: 'unlockHeight',
      render: (unlockHeight, memberInfo) => {
        let locked = true;
        let unlockDateTime = undefined;
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
          <Button type="link" title="追加锁仓天数" icon={<ClockCircleOutlined />} style={{ float: "right" }} size="small">Add</Button>
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
            <AddressComponent address={addr} ellipsis copyable />
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
      const getRecordByIDCalls = memberInfos.map(memberInfo => {
        const { lockID } = memberInfo;
        return [
          accountManagerContract.address,
          accountManagerContract.interface.encodeFunctionData(getRecordByIDFragment, [lockID])
        ]
      });
      multicallContract.callStatic.aggregate(getRecordByIDCalls)
        .then(data => {
          const multicallDatas = data[1];
          multicallDatas.map((raw: any) => {
            const _accountRecord = accountManagerContract.interface.decodeFunctionResult(getRecordByIDFragment, raw)[0];
            return formatAccountRecord(_accountRecord);
          }).forEach((accountRecord: AccountRecord) => {
            memberInfos.forEach(memberInfo => {
              if (memberInfo.lockID == accountRecord.id) {
                memberInfo.unlockHeight = accountRecord.unlockHeight;
              }
            });
            setMemberInfos([...memberInfos]);
          })
        })
    }
  }, [memberInfos, multicallContract, accountManagerContract])

  return <>
    <Table dataSource={_memberInfos} columns={columns} />
  </>
}
