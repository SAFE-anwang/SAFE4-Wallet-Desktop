
import { Row, Statistic, Card, Col, Typography, Button, Divider, Space, Tag, List, Input, Select, Tooltip, Checkbox } from "antd";
import { ApartmentOutlined, ClockCircleOutlined, ClusterOutlined, ContainerFilled, ContainerOutlined, ContainerTwoTone, LockOutlined } from '@ant-design/icons';
import { EmptyContract, SystemContract } from "../../../../../constants/SystemContracts";
import { DateTimeFormat } from "../../../../../utils/DateUtils";
import AddressComponent from "../../../../components/AddressComponent";
import { AccountRecord } from "../../../../../structs/AccountManager";

const { Text } = Typography;

export enum AccountRecordRenderType {
  Details = 1,
  Simple = 2,
  Small = 3
}

export default ({
  accountRecord,
  renderType,
  blockNumber,
  timestamp,
  t,
  supernodeAddresses,
  checkedAccountRecordIds,
  actions
}: {
  accountRecord: AccountRecord,
  renderType: AccountRecordRenderType,
  blockNumber: number,
  timestamp: number,
  t: any,
  supernodeAddresses: string[],
  checkedAccountRecordIds?: number[]
  actions?: {
    withdraw?: (accountRecord: AccountRecord) => void,
    addLockDay?: (accountRecord: AccountRecord) => void,
    checked?: (accountRecord: AccountRecord) => void
  }
}) => {

  // const { t } = useTranslation();

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

  return <>
    {
      renderType == AccountRecordRenderType.Details &&
      <Card key={id} size="small" style={{ marginTop: "30px" }}>
        <Row>
          <Col span={6}>
            <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px", fontWeight: "600" }}>{t("wallet_locked_accountRecordLockInfo")}</Divider>
            <Text strong type="secondary">{t("wallet_locked_accountRecordLockId")}</Text><br />
            <Text strong>
              {
                locked && <LockOutlined />
              }
              {id}
            </Text>
            <Divider style={{ margin: "4px 0" }} />
            <Text strong type="secondary">{t("wallet_locked_lockedAmount")}</Text><br />
            <Text strong>{amount.toFixed(2)} SAFE</Text>
            <Divider style={{ margin: "4px 0" }} />
            <Text strong type="secondary">{t("wallet_locked_unlockHeight")}</Text><br />
            <Text strong type={locked ? "secondary" : "success"}>{unlockHeight}</Text>
            {
              unlockDateTime && <Text strong style={{ float: "right" }} type="secondary">[{unlockDateTime}]</Text>
            }
          </Col>
          <Col>
            <Divider type="vertical" style={{ height: "100%" }} />
          </Col>
          <Col span={17}>
            <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px" }}>{t("wallet_locked_accountRecordUseInfo")}</Divider>
            <Row>
              <Col span={13}>
                <Text strong type="secondary">{t("wallet_locked_memberOfNode")}</Text><br />
                {
                  frozenAddr == EmptyContract.EMPTY && <>
                    <Tag>{t("wallet_locked_notMember")}</Tag>
                  </>
                }
                {
                  frozenAddr != EmptyContract.EMPTY && <>
                    <AddressComponent address={frozenAddr} copyable qrcode />
                  </>
                }
              </Col>
              <Col offset={3} span={8}>
                <Text strong type="secondary" style={{ float: "right" }}>{t("wallet_locked_stakeRelease")}</Text><br />
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
              <Col span={13}>
                <Text strong type="secondary">{t("wallet_locked_votedSupernode")}</Text><br />
                {
                  votedAddr == EmptyContract.EMPTY && <>
                    <Tag>{t("wallet_locked_notVoted")}</Tag>
                  </>
                }
                {
                  votedAddr != EmptyContract.EMPTY && <>
                    <AddressComponent address={votedAddr} qrcode copyable />
                  </>
                }
              </Col>
              <Col offset={3} span={8}>
                <Text strong type="secondary" style={{ float: "right" }}>{t("wallet_locked_stakeRelease")}</Text><br />
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
                {
                  id != 0 && accountRecord?.contractAddress == SystemContract.AccountManager && <>
                    {
                      actions?.addLockDay && <Button size="small" icon={<ClockCircleOutlined />} title="追加锁仓" onClick={() => {
                        actions.addLockDay && actions.addLockDay(accountRecord);
                      }}>
                        {t("wallet_locked_addLockDay")}
                      </Button>
                    }
                  </>
                }
                {
                  actions?.withdraw && <Button title="提现" disabled={!couldWithdraw} size="small" type="primary" onClick={() => {
                    actions.withdraw && actions.withdraw(accountRecord);
                  }}>{t("wallet_withdraw")}</Button>
                }
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    }

    {
      renderType == AccountRecordRenderType.Simple &&
      <Card key={id} size="small" style={{ marginTop: "30px" }}>
        <Row>
          <Col span={24}>
            <Divider orientation="center" style={{ fontSize: "14px", marginTop: "-23px", fontWeight: "600" }}>{t("wallet_locked_accountRecordLockInfo")}</Divider>
            <Text strong type="secondary">{t("wallet_locked_accountRecordLockId")}</Text>
            {
              checkedAccountRecordIds != undefined && <>
                <Checkbox checked={checkedAccountRecordIds.includes(accountRecord.id)} style={{ float: "right" }} onChange={() => {
                  if (actions?.checked) {
                    actions.checked(accountRecord);
                  }
                }} />
              </>
            }
            <br />
            <Text strong>
              {
                locked && <LockOutlined />
              }
              {id}
            </Text>
            <Space style={{ float: "right" }}>
              {
                frozenAddr != EmptyContract.EMPTY && supernodeAddresses &&
                <Tooltip title={<>
                  {
                    supernodeAddresses.includes(frozenAddr) ?
                      "用于建立超级节点"
                      : "用于建立主节点"
                  }
                  : {frozenAddr}
                </>}>
                  {
                    supernodeAddresses.includes(frozenAddr) ?
                      <ClusterOutlined />
                      : <ApartmentOutlined />
                  }
                </Tooltip>
              }
              {
                votedAddr != EmptyContract.EMPTY &&
                <Tooltip title={<>
                  已投票
                </>}>
                  <ContainerOutlined />
                </Tooltip>
              }
            </Space>
            <Divider style={{ margin: "4px 0" }} />
            <Text strong type="secondary">{t("wallet_locked_lockedAmount")}</Text>
            {
              actions && actions.withdraw && <Button style={{ float: "right" }} title="提现" disabled={!couldWithdraw} size="small" type="primary" onClick={() => {
                actions.withdraw && actions.withdraw(accountRecord);
              }}>{t("wallet_withdraw")}</Button>
            }
            <br />
            <Text strong>{amount.toSignificant(4)} SAFE</Text>
            <Divider style={{ margin: "4px 0" }} />
            <Text strong type="secondary">{t("wallet_locked_unlockHeight")}</Text>
            {
              id != 0 && accountRecord?.contractAddress == SystemContract.AccountManager && <>
                {
                  actions?.addLockDay && <Button style={{ float: "right" }} size="small" icon={<ClockCircleOutlined />} title="追加锁仓" onClick={() => {
                    actions.addLockDay && actions.addLockDay(accountRecord);
                  }}>
                    {t("wallet_locked_addLockDay")}
                  </Button>
                }
              </>
            }
            <br />
            <Text strong type={locked ? "secondary" : "success"} style={{ float: "left" }}>{unlockHeight}</Text>
            {
              unlockDateTime && <Text strong style={{ float: "right", fontSize: "12px" }} type="secondary">[{unlockDateTime}]</Text>
            }
          </Col>
        </Row>
      </Card>
    }

    {
      renderType == AccountRecordRenderType.Small &&
      <Card key={id} size="small" style={{}}>
        <Row>
          <Col span={24}>
            <Text strong type="secondary">
              {t("wallet_locked_accountRecordLockId")}:
              {id}
            </Text>
            {
              checkedAccountRecordIds != undefined && <>
                <Checkbox checked={checkedAccountRecordIds.includes(accountRecord.id)} style={{ float: "right" }} onChange={() => {
                  if (actions?.checked) {
                    actions.checked(accountRecord);
                  }
                }} />
              </>
            }
            <br />
            {
              locked && <LockOutlined />
            }
            <Text strong>{amount.toSignificant(4)} SAFE</Text>
            <Space style={{ float: "right" }}>
              {
                frozenAddr != EmptyContract.EMPTY && supernodeAddresses &&
                <Tooltip title={<>
                  {
                    supernodeAddresses.includes(frozenAddr) ?
                      "用于建立超级节点"
                      : "用于建立主节点"
                  }
                  : {frozenAddr}
                </>}>
                  {
                    supernodeAddresses.includes(frozenAddr) ?
                      <ClusterOutlined />
                      : <ApartmentOutlined />
                  }
                </Tooltip>
              }
              {
                votedAddr != EmptyContract.EMPTY &&
                <Tooltip title={<>
                  已投票
                </>}>
                  <ContainerOutlined />
                </Tooltip>
              }
            </Space>
          </Col>
        </Row>
      </Card>
    }


  </>

}
