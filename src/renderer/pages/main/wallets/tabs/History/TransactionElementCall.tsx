
import { Row, List, Typography } from "antd";
import { FileDoneOutlined } from '@ant-design/icons';
import { useCallback, useMemo, useState } from "react";
import { TransactionDetails } from "../../../../../state/transactions/reducer";
import EtherAmount from "../../../../../utils/EtherAmount";
import DecodeSupportFunction from "../../../../../constants/DecodeSupportFunction";
import TransactionElementTemplate from "./TransactionElementTemplate";
import AccountManagerSafeDeposit from "./AccountManagerSafeDeposit";
import { DB_AddressActivity_Actions } from "../../../../../../main/handlers/DBAddressActivitySingalHandler";
import TransactionElementCallSupport from "./TransactionElementCallSupport";
import AccountManagerSafeWithdraw from "./AccountManagerSafeWithdraw";
import TransactionElementTokenTransfer from "./TransactionElementTokenTransfer";
import { SAFE_LOGO } from "../../../../../assets/logo/AssetsLogo";
import { useTranslation } from "react-i18next";
import { useWalletsActiveAccount } from "../../../../../state/wallets/hooks";

const { Text } = Typography;


export default ({ transaction, setClickTransaction }: {
  transaction: TransactionDetails,
  setClickTransaction: (transaction: TransactionDetails) => void
}) => {
  const { t } = useTranslation();
  const {
    status,
    call,
    accountManagerDatas,
    internalTransfers,
    tokenTransfers
  } = transaction;
  const { value, input, action } = useMemo(() => {
    return {
      from: transaction.refFrom,
      to: transaction.refTo,
      action: call?.action ? call.action : transaction.action,
      value: call?.value,
      input: call?.input,
    }
  }, [transaction]);
  const support = DecodeSupportFunction(call?.to, input, call?.from);
  // 判断是否为调用 ERC20.transfer(to,uint256)
  const isTokenTransfer = useMemo(() => {
    if (call?.tokenTransfer) {
      return true;
    }
    if (call?.input.indexOf("0xa9059cbb") == 0) {
      return tokenTransfers && Object.keys(tokenTransfers).length == 1;
    }
    return false;
  }, [call, tokenTransfers]);
  const activeAccount = useWalletsActiveAccount();

  const RenderTokenTransfer = useCallback(() => {
    let firstTokenTransfer = undefined;
    if (tokenTransfers) {
      Object.keys(tokenTransfers)
        .forEach((eventLogIndex, index: number) => {
          if (index == 0) { firstTokenTransfer = tokenTransfers[eventLogIndex] }
        })
    }
    const tokenTransfer = call?.tokenTransfer ? call.tokenTransfer : tokenTransfers ? firstTokenTransfer : undefined;
    return <>
      <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <span style={{ width: "100%" }}>
          {tokenTransfer && <TransactionElementTokenTransfer transaction={transaction} status={status} tokenTransfer={tokenTransfer} />}
        </span>
      </List.Item>
    </>
  }, [transaction, status]);

  const RenderNoSupportCallAssetFlow = (call_from?: string, call_to?: string, value?: string) => {
    if (call_from == call_to) {
      return <Text strong>
        <>- {value && EtherAmount({ raw: "0" })} SAFE</>
      </Text>
    }
    if (call_to == activeAccount) {
      return <Text type="success">
        <>+ {value && EtherAmount({ raw: value })} SAFE</>
      </Text>
    }
    return <Text strong>
      <>- {value && EtherAmount({ raw: value })} SAFE</>
    </Text>
  }

  return <>
    {/* <Text>{JSON.stringify(support)}</Text> */}
    {
      support && <TransactionElementCallSupport transaction={transaction} setClickTransaction={setClickTransaction} support={support} />
    }
    {
      !support && isTokenTransfer && <>
        {RenderTokenTransfer()}
      </>
    }
    {
      !support && !isTokenTransfer && <List.Item onClick={() => { setClickTransaction(transaction) }} key={transaction.hash} className="history-element" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
        <Row style={{ width: "100%" }}>
          <span style={{ width: "100%" }}>
            <TransactionElementTemplate status={status} icon={<FileDoneOutlined style={{ color: "black" }} />}
              title={action == "Create" ? t("wallet_history_contract_deploy") : t("wallet_history_contract_call")}
              description={call?.to} assetFlow={RenderNoSupportCallAssetFlow(call?.from, call?.to, call?.value)}
            />
          </span>
          {
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Deposit)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                return <span style={{ width: "100%", marginTop: "20px" }}>
                  <AccountManagerSafeDeposit from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }
          {
            accountManagerDatas && Object
              .keys(accountManagerDatas)
              .filter(eventLogIndex => accountManagerDatas[eventLogIndex].action == DB_AddressActivity_Actions.AM_Withdraw)
              .map(eventLogIndex => {
                const accountManagerData = accountManagerDatas[eventLogIndex];
                return <span style={{ width: "100%", marginTop: "20px" }}>
                  <AccountManagerSafeWithdraw from={accountManagerData.from} to={accountManagerData.to} value={accountManagerData.amount} status={1} />
                </span>
              })
          }
          {
            internalTransfers && Object
              .keys(internalTransfers)
              .map(eventLogIndex => {
                const internalTransfer = internalTransfers[eventLogIndex];
                const { from, to, value } = internalTransfer;
                return <span style={{ width: "100%", marginTop: "20px" }}>
                  <TransactionElementTemplate
                    icon={SAFE_LOGO}
                    title={t("wallet_history_received")}
                    status={status}
                    description={from}
                    assetFlow={<>
                      <Text type="success" strong>
                        +{value && EtherAmount({ raw: value, fix: 18 })} SAFE
                      </Text>
                    </>}
                  />
                </span>
              })
          }
          {
            tokenTransfers && Object
              .keys(tokenTransfers)
              .map(eventLogIndex => {
                const tokenTransfer = tokenTransfers[eventLogIndex]
                return <>
                  <span style={{ width: "100%", marginTop: "20px" }}>
                    <TransactionElementTokenTransfer transaction={transaction} status={status} tokenTransfer={tokenTransfer} />
                  </span>
                </>
              })
          }
        </Row>
      </List.Item>
    }
  </>
}
